/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ImageTruth AI'
const SITE_URL = 'https://imagetruthai.com'
const LOGO_URL = 'https://tzldselzotgmfgmuxpih.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface ContactConfirmationProps {
  name?: string
  message?: string
}

const ContactConfirmationEmail = ({ name, message }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="140" height="auto" style={{ marginBottom: '24px' }} />
        <Heading style={h1}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Heading>
        <Text style={text}>
          Thanks for reaching out! We received your message and will get back to you within 24 hours.
        </Text>
        {message && (
          <Text style={quoteStyle}>
            "{message}"
          </Text>
        )}
        <Text style={text}>
          Best,<br />
          The {SITE_NAME} Team
        </Text>
        <Text style={footer}>
          <Link href={SITE_URL} style={link}>imagetruthai.com</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: `We received your message — ${SITE_NAME}`,
  displayName: 'Contact form confirmation',
  previewData: { name: 'Jane', message: 'I have a question about the Pro plan.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Space Grotesk', Arial, sans-serif",
  color: '#1a1d2e',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#70778a',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const quoteStyle = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 24px',
  padding: '12px 16px',
  backgroundColor: '#f4f6f9',
  borderRadius: '8px',
  borderLeft: '3px solid #4d7cff',
  fontStyle: 'italic' as const,
}
const link = { color: '#4d7cff', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
