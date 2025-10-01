import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const options = await generateRegistrationOptions({
      rpName: 'GitGud AI',
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      userID: Buffer.from(email),
      userName: email,
      userDisplayName: email,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Store challenge in session/database (for production, use proper storage)
    // For now, we'll return it to be stored client-side temporarily
    return NextResponse.json({
      options,
      challenge: options.challenge,
    });
  } catch (error) {
    console.error('WebAuthn registration challenge error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}