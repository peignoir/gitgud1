import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const options = await generateAuthenticationOptions({
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      allowCredentials: [],
      userVerification: 'preferred',
    });

    return NextResponse.json({
      options,
      challenge: options.challenge,
    });
  } catch (error) {
    console.error('WebAuthn authentication challenge error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}