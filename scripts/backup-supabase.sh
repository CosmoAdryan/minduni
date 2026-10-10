#!/usr/bin/env bash
#
# Backup do banco Supabase, cifrado, com cópia no servidor cPanel.
#
# Motivo: o plano Free do Supabase não inclui backup automático. Este script
# cobre essa lacuna — é a única proteção contra perda de dados hoje.
#
# Fluxo:  pg_dump  ->  gzip  ->  GPG (AES-256)  ->  upload FTPS/SFTP  ->  retenção
#
# O dump contém dados pessoais sensíveis (diário, humor, conversas — LGPD art. 11).
# Por isso a cifragem é OBRIGATÓRIA e acontece ANTES do upload: o arquivo nunca
# trafega nem repousa em claro no servidor compartilhado. Sem a passphrase o
# script aborta em vez de enviar texto claro.
#
# Uso:
#   cp .env.backup.example .env.backup   # preencha os valores
#   bash scripts/backup-supabase.sh
#
# Requisitos:
#   pg_dump 17+  (o servidor é Postgres 17.6; um pg_dump mais antigo recusa)
#   gzip, gpg, curl
#
# Restauração (ver docs/SEGURANCA-E-DISPONIBILIDADE.md):
#   gpg --decrypt minduni-AAAAMMDD-HHMMSS.sql.gz.gpg | gunzip | psql "$SUPABASE_DB_URL"

set -euo pipefail

cd "$(dirname "$0")/.."

# ── Configuração ─────────────────────────────────────────────────────────────
if [ -f .env.backup ]; then
  set -a; . ./.env.backup; set +a
fi

: "${SUPABASE_DB_URL:?defina SUPABASE_DB_URL (Supabase > Connect > connection string)}"
: "${BACKUP_PASSPHRASE:?defina BACKUP_PASSPHRASE — sem ela o backup NAO sera cifrado e o script aborta}"

BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_KEEP="${BACKUP_KEEP:-8}"
UPLOAD_MODE="${UPLOAD_MODE:-ftps}"   # ftps | sftp | none

STAMP="$(date -u '+%Y%m%d-%H%M%S')"
BASENAME="minduni-${STAMP}.sql.gz.gpg"
OUT="${BACKUP_DIR}/${BASENAME}"

log() { printf '[backup] %s\n' "$*"; }
die() { printf '[backup] ERRO: %s\n' "$*" >&2; exit 1; }

# ── Pré-requisitos ───────────────────────────────────────────────────────────
for bin in pg_dump gzip gpg; do
  command -v "$bin" >/dev/null 2>&1 || die "'$bin' não encontrado no PATH."
done

# pg_dump precisa ser >= a versão do servidor (17.x), senão recusa o dump.
DUMP_MAJOR="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
if [ "${DUMP_MAJOR:-0}" -lt 17 ]; then
  die "pg_dump $DUMP_MAJOR é antigo demais para o servidor 17.x. Instale o client 17+."
fi

mkdir -p "$BACKUP_DIR"

# ── 1) Dump + compressão + cifragem, tudo em pipe ────────────────────────────
# Em pipe para que o SQL em claro nunca toque o disco. pipefail garante que a
# falha do pg_dump derrube a cadeia inteira em vez de gerar um .gpg truncado.
log "Gerando dump cifrado -> $OUT"
umask 077
if ! pg_dump \
      --dbname="$SUPABASE_DB_URL" \
      --format=plain \
      --no-owner \
      --no-privileges \
      --quote-all-identifiers \
      --schema=public \
      --schema=auth \
      --schema=storage \
    | gzip -9 \
    | gpg --batch --yes --symmetric --cipher-algo AES256 \
          --passphrase-fd 3 --output "$OUT" 3<<<"$BACKUP_PASSPHRASE"
then
  rm -f "$OUT"
  die "Falha ao gerar o backup. Nada foi enviado."
fi

chmod 600 "$OUT"

# Um .gpg válido tem cabeçalho e tamanho razoável. Guarda contra dump vazio.
SIZE="$(wc -c < "$OUT" | tr -d ' ')"
[ "$SIZE" -gt 1024 ] || { rm -f "$OUT"; die "Arquivo gerado tem só ${SIZE} bytes — dump vazio?"; }
log "Backup pronto: $(du -h "$OUT" | cut -f1)"

# Conferência de integridade: o GPG consegue reabrir o que acabou de escrever?
gpg --batch --quiet --decrypt --passphrase-fd 3 3<<<"$BACKUP_PASSPHRASE" "$OUT" \
  | gunzip -t 2>/dev/null \
  || die "O arquivo cifrado não passou na verificação. Não enviado."
log "Integridade verificada (decifra e descomprime)."

# ── 2) Upload para o cPanel ──────────────────────────────────────────────────
upload_ftps() {
  : "${CPANEL_HOST:?defina CPANEL_HOST}"
  : "${CPANEL_USER:?defina CPANEL_USER}"
  : "${CPANEL_PASS:?defina CPANEL_PASS}"
  : "${CPANEL_REMOTE_DIR:?defina CPANEL_REMOTE_DIR}"

  # O dump não pode ficar acessível pela web, nem cifrado.
  case "$CPANEL_REMOTE_DIR" in
    *public_html*|*www*)
      die "CPANEL_REMOTE_DIR ('$CPANEL_REMOTE_DIR') está numa pasta servida pela web. Use um diretório fora de public_html." ;;
  esac

  log "Enviando via FTPS para ${CPANEL_HOST}:${CPANEL_REMOTE_DIR}/"
  # --ssl-reqd: aborta se o servidor não oferecer TLS (nunca cai para FTP puro).
  curl --fail --silent --show-error \
       --ssl-reqd \
       --ftp-create-dirs \
       --connect-timeout 30 --max-time 900 \
       --user "${CPANEL_USER}:${CPANEL_PASS}" \
       --upload-file "$OUT" \
       "ftp://${CPANEL_HOST}/${CPANEL_REMOTE_DIR}/${BASENAME}" \
    || die "Upload FTPS falhou. A cópia local em $OUT foi preservada."
}

upload_sftp() {
  : "${CPANEL_HOST:?defina CPANEL_HOST}"
  : "${CPANEL_USER:?defina CPANEL_USER}"
  : "${CPANEL_REMOTE_DIR:?defina CPANEL_REMOTE_DIR}"
  SSH_PORT="${CPANEL_SSH_PORT:-22}"

  log "Enviando via SFTP para ${CPANEL_HOST}:${CPANEL_REMOTE_DIR}/"
  # Autenticação por chave. Senha via SFTP exigiria sshpass; chave é melhor.
  printf 'put %s %s/%s\n' "$OUT" "$CPANEL_REMOTE_DIR" "$BASENAME" \
    | sftp -P "$SSH_PORT" -b - "${CPANEL_USER}@${CPANEL_HOST}" \
    || die "Upload SFTP falhou. A cópia local em $OUT foi preservada."
}

case "$UPLOAD_MODE" in
  ftps) upload_ftps ;;
  sftp) upload_sftp ;;
  none) log "UPLOAD_MODE=none: mantendo apenas a cópia local." ;;
  *)    die "UPLOAD_MODE inválido: '$UPLOAD_MODE' (use ftps, sftp ou none)." ;;
esac

# ── 3) Retenção local ────────────────────────────────────────────────────────
# Mantém os N mais recentes. A limpeza do lado do cPanel é manual ou por cron lá.
log "Retenção local: mantendo os ${BACKUP_KEEP} backups mais recentes."
ls -1t "${BACKUP_DIR}"/minduni-*.sql.gz.gpg 2>/dev/null \
  | tail -n "+$((BACKUP_KEEP + 1))" \
  | while IFS= read -r old; do
      log "removendo antigo: $(basename "$old")"
      rm -f -- "$old"
    done

log "Concluído em $(date -u '+%Y-%m-%d %H:%M UTC')."
