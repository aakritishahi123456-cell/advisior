function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

module.exports = {
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 5050),
    databaseUrl: process.env.DATABASE_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  required,
};

