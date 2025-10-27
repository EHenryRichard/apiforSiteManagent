const getClientInfo = async (req) => {
  // Get IP address
  const getIpAddress = () => {
    const ip =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket
        ? req.connection.socket.remoteAddress
        : null) ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'];

    // Clean IPv6 localhost or IPv4-mapped IPv6 addresses
    if (
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip?.startsWith('::ffff:')
    ) {
      return ip?.replace('::ffff:', '') || '127.0.0.1';
    }

    return ip;
  };

  // Parse device info from user agent
  const getUserAgent = () => {
    const userAgent = req.headers['user-agent'] || '';

    return {
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      device: getDevice(userAgent),
      userAgent: userAgent,
    };
  };

  const ipAddress = getIpAddress();
  const country = await getCountry(ipAddress);

  return {
    ipAddress,
    country,
    ...getUserAgent(),
  };
};

const getBrowser = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  return 'Unknown';
};

const getOS = (userAgent) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

const getDevice = (userAgent) => {
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

const getCountry = async (ipAddress) => {
  // Return default for localhost/private IPs
  if (
    !ipAddress ||
    ipAddress === '127.0.0.1' ||
    ipAddress === 'localhost' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return 'Unknown';
  }

  try {
    // Using ip-api.com free service (no API key required)
    // Rate limit: 45 requests per minute
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode`
    );

    if (!response.ok) {
      console.error('Failed to fetch country from IP API');
      return 'Unknown';
    }

    const data = await response.json();

    if (data.status === 'success') {
      return data.country || 'Unknown';
    }

    return 'Unknown';
  } catch (error) {
    console.error(
      'Error fetching country from IP:',
      error.message
    );
    return 'Unknown';
  }
};

export default getClientInfo;
