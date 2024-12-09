export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    adminClientEmail: process.env.GOOGLE_ADMIN_CLIENT_EMAIL,
    adminPrivateKey: process.env.GOOGLE_ADMIN_PRIVATE_KEY,
    adminSubject: process.env.GOOGLE_ADMIN_SUBJECT,
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN,
    secret: process.env.COOKIE_SECRET,
  },
  qr: {
    secret: process.env.QR_SECRET,
  },
});
