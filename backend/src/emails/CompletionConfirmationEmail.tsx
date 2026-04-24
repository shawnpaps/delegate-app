import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components";

interface CompletionConfirmationEmailProps {
  taskTitle: string;
  assigneeName?: string;
  assigneeEmail: string;
  completedAt: string;
}

export function CompletionConfirmationEmail({
  taskTitle,
  assigneeName,
  assigneeEmail,
  completedAt,
}: CompletionConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Task completed: {taskTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Task Completed</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>Good news! The task has been marked as completed.</Text>

          <Section style={taskBox}>
            <Heading as="h2" style={h2}>
              {taskTitle}
            </Heading>
            <Text style={meta}>
              Completed by: <strong>{assigneeName || assigneeEmail}</strong>
              <br />
              Completed at: {completedAt}
            </Text>
          </Section>

          <Text style={text}>No further action is required for this task.</Text>

          <Text style={footer}>
            Sent via Delegate - Lightweight delegation for small business owners.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CompletionConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "24px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "12px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const taskBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const meta = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "32px",
  textAlign: "center" as const,
};
