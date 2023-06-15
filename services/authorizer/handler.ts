import jwt from 'jsonwebtoken';

const SECRET = process.env.SECRET;

export const authorizer = async (event: any, _context: any) => {
  if (!SECRET) {
    throw new Error('Invalid JWT Secret');
  }

  const token = event.authorizationToken;

  if (!token) {
    throw new Error('JWT Token required');
  }

  try {
    const decodedToken = jwt.verify(token, SECRET);
    return generatePolicy(decodedToken.sub, 'Allow', event.methodArn);
  } catch (error) {
    console.error('Failed to validate JWT Token:', error);
    throw new Error('Invalid Token');
  }
};

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  return authResponse;
}
