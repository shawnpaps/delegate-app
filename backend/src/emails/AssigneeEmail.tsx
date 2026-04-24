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
  Button,
} from "@react-email/components";

interface AssigneeEmailProps {
  taskTitle: string;
  taskDescription?: string;
  creatorName: string;
  creatorEmail: string;
  emailToken: string;
}

export function AssigneeEmail({
  taskTitle,
  taskDescription,
  creatorName,
  creatorEmail,
  emailToken,
}: AssigneeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New task assigned to you: {taskTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📦 New Task Assigned</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>
            <strong>{creatorName}</strong> ({creatorEmail}) has assigned you a new task:
          </Text>

          <Section style={taskBox}>
            <Heading as="h2" style={h2}>
              {taskTitle}
            </Heading>
            {taskDescription && <Text style={taskDescriptionStyle}>{taskDescription}</Text>}
          </Section>

          <Text style={text}>
            To complete this task, simply reply to this email with the word{" "}
            <strong>"complete"</strong>.
          </Text>

          <Text style={text}>
            Alternatively, you can reply with any message that includes the word "complete".
          </Text>

          <Text style={footer}>
            This task was sent via Delegate - Lightweight delegation for small business owners.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AssigneeEmail;

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
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const taskDescriptionStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "32px",
  textAlign: "center" as const,
};
