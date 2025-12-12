module.exports = ({ config }) => ({
  ...config,
  extra: {
    apiUrl:
      process.env.NODE_ENV === "development"
        ? "http://localhost:8001"
        : "http://15.165.37.27:8000",
  },
});