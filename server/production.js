// Validate configuration without printing credentials or contacting providers.
export function productionIssues(env = process.env) {
  const issues = [];
  if (env.NODE_ENV !== 'production') issues.push('Set NODE_ENV=production on the public server.');
  try {
    const url = new URL(env.APP_URL);
    if (url.protocol !== 'https:' || url.origin !== env.APP_URL || url.username || url.password ||
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error();
  } catch { issues.push('Set APP_URL to the public HTTPS origin, without a trailing slash or path.'); }
  if (env.PAYMENT_PROVIDER !== 'razorpay') issues.push('Set PAYMENT_PROVIDER=razorpay.');
  if (!env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')) issues.push('Install a Razorpay live API key ID.');
  if (!env.RAZORPAY_KEY_SECRET) issues.push('Install the matching Razorpay live API key secret.');
  if (env.LIVE_PAYMENTS_ENABLED !== 'true') issues.push('Set LIVE_PAYMENTS_ENABLED=true after installing live credentials.');
  if (!env.RAZORPAY_WEBHOOK_SECRET) issues.push('Configure a live Razorpay webhook and its dedicated secret.');
  else if (env.RAZORPAY_WEBHOOK_SECRET === env.RAZORPAY_KEY_SECRET) issues.push('Use a webhook secret different from the API key secret.');
  const port = Number(env.SMTP_PORT || 587);
  if (env.MAIL_MODE !== 'smtp' || !env.SMTP_HOST || !env.MAIL_FROM ||
      !Number.isInteger(port) || port < 1 || port > 65535 || !!env.SMTP_USER !== !!env.SMTP_PASSWORD) {
    issues.push('Configure SMTP email delivery for account verification and password recovery.');
  }
  if (env.DB_NAME !== 'leadnest' || !env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD) {
    issues.push('Configure the production leadnest database connection.');
  }
  return issues;
}

export function assertProductionReady(env = process.env) {
  const issues = productionIssues(env);
  if (issues.length) throw new Error('Production configuration incomplete:\n- ' + issues.join('\n- '));
}
