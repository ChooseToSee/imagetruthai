/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ImageTruth AI'
const LOGO_URL = 'https://tzldselzotgmfgmuxpih.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface ContactNotificationProps {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, subject, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form message from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={SITE_NAME} width="140" height="auto" style={{ marginBottom: '24px' }} />
        <Heading style={h1}>New Contact Form Message</Heading>
        <Text style={text}>A new message was submitted via the contact form.</Text>
        <Hr style={hr} />
        <Text style={label}>Name</Text>
        <Text style={value}>{name || 'Not provided'}</Text>
        <Text style={label}>Email</Text>
        <Text style={value}>{email || 'Not provided'}</Text>
        {subject && (
          <>
            <Text style={label}>Subject</Text>
            <Text style={value}>{subject}</Text>
          </>
        )}
        <Text style={label}>Message</Text>
        <Text style={value}>{message || 'No message'}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `New Contact Form Message: ${data.subject || 'No subject'}`,
  to: 'support@imagetruthai.com',
  displayName: 'Contact form notification (admin)',
  previewData: { name: 'Jane Doe', email: 'jane@example.com', subject: 'Pro plan question', message: 'I would like to know more about the Pro plan features.' },
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
const text = { fontSize: '14px', color: '#70778a', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '16px 0' }
const label = { fontSize: '12px', color: '#999999', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const value = { fontSize: '14px', color: '#1a1d2e', lineHeight: '1.6', margin: '0 0 16px' }
