module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
        },
      ],
      // Reanimated 4 / SDK 54: o plugin de worklets já é incluído pelo
      // babel-preset-expo automaticamente. Não adicionar manualmente o plugin
      // (react-native-reanimated/plugin foi movido para react-native-worklets
      // e declará-lo aqui causa conflito).
    ],
  };
};
