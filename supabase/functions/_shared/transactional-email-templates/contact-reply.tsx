/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Link, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ImageTruth AI'
const SITE_URL = 'https://imagetruthai.com'
const LOGO_URL = 'https://tzldselzotgmfgmuxpih.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface ContactReplyProps {
  name?: string
  originalMessage?: string
  replyMessage?: string
}

const ContactReplyEmail = ({ name, originalMessage, replyMessage }: ContactReplyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reply from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="140" height="auto" style={{ marginBottom: '24px' }} />
        <Heading style={h1}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Heading>
        <Text style={text}>
          {replyMessage || 'Thank you for your message. We wanted to follow up with you.'}
        </Text>
        {originalMessage && (
          <>
            <Hr style={hr} />
            <Text style={label}>Your original message:</Text>
            <Text style={quoteStyle}>
              "{originalMessage}"
            </Text>
          </>
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
  component: ContactReplyEmail,
  subject: (data: Record<string, any>) =>
    data.subject ? `Re: ${data.subject}` : `Reply from ${SITE_NAME}`,
  displayName: 'Contact reply',
  previewData: {
    name: 'Jane',
    originalMessage: 'I have a question about the Pro plan.',
    replyMessage: 'Thanks for asking! Our Pro plan includes unlimited scans and advanced forensic reports.',
    subject: 'Pro plan question',
  },
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
const hr = { borderColor: '#e5e7eb', margin: '8px 0 16px' }
const label = {
  fontSize: '12px',
  color: '#999999',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
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
