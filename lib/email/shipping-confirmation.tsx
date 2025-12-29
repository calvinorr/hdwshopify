import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderItem {
  productName: string;
  colorway: string | null;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

interface ShippingConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export function ShippingConfirmationEmail({
  orderNumber,
  customerName,
  items,
  shippingAddress,
  shippingMethod,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
}: ShippingConfirmationEmailProps) {
  const previewText = `Your order ${orderNumber} has shipped!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>Herbarium Dyeworks</Heading>
            <Text style={tagline}>Naturally Dyed Yarn</Text>
          </Section>

          <Hr style={hr} />

          {/* Shipping Confirmation */}
          <Section style={content}>
            <Heading style={heading}>Your Order Has Shipped! 📦</Heading>
            <Text style={paragraph}>
              Hi {customerName || "there"},
            </Text>
            <Text style={paragraph}>
              Great news! Your order is on its way. Your hand-dyed yarn has been
              carefully packed and is heading to you.
            </Text>

            {/* Order Details Box */}
            <Section style={orderBox}>
              <Row>
                <Column>
                  <Text style={labelText}>Order Number</Text>
                  <Text style={valueText}>{orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={labelText}>Shipping Method</Text>
                  <Text style={valueText}>{shippingMethod}</Text>
                </Column>
              </Row>
              {estimatedDelivery && (
                <Row style={{ marginTop: "15px" }}>
                  <Column>
                    <Text style={labelText}>Estimated Delivery</Text>
                    <Text style={valueText}>{estimatedDelivery}</Text>
                  </Column>
                </Row>
              )}
            </Section>
          </Section>

          {/* Tracking Section */}
          {trackingNumber && (
            <Section style={content}>
              <Heading as="h2" style={subheading}>Track Your Package</Heading>
              <Section style={trackingBox}>
                <Text style={trackingLabel}>Tracking Number</Text>
                <Text style={trackingNumber_style}>{trackingNumber}</Text>
                {trackingUrl && (
                  <Button style={trackButton} href={trackingUrl}>
                    Track Package
                  </Button>
                )}
              </Section>
            </Section>
          )}

          {/* Items Shipped */}
          <Section style={content}>
            <Heading as="h2" style={subheading}>Items Shipped</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDetails}>
                  <Text style={itemName}>{item.productName}</Text>
                  {item.colorway && item.colorway !== item.productName && (
                    <Text style={itemVariant}>{item.colorway}</Text>
                  )}
                </Column>
                <Column style={itemQuantityCol}>
                  <Text style={itemQuantity}>× {item.quantity}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Shipping Address */}
          <Section style={content}>
            <Heading as="h2" style={subheading}>Shipping To</Heading>
            <Text style={addressText}>
              {shippingAddress.name}<br />
              {shippingAddress.line1}<br />
              {shippingAddress.line2 && <>{shippingAddress.line2}<br /></>}
              {shippingAddress.city}, {shippingAddress.postalCode}<br />
              {shippingAddress.country}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions about your shipment? Reply to this email or contact us at{" "}
              <Link href="mailto:hello@herbarium-dyeworks.com" style={link}>
                hello@herbarium-dyeworks.com
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href="https://herbarium-dyeworks.com" style={link}>
                herbarium-dyeworks.com
              </Link>
            </Text>
            <Text style={footerSmall}>
              Herbarium Dyeworks - Naturally Dyed Yarn from Northern Ireland
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#2d4a3e",
  padding: "30px 40px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "400",
  letterSpacing: "2px",
  margin: "0",
  fontFamily: "Georgia, serif",
};

const tagline = {
  color: "#c5d5cd",
  fontSize: "12px",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "8px 0 0 0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "30px 40px",
};

const heading = {
  color: "#2d4a3e",
  fontSize: "24px",
  fontWeight: "400",
  margin: "0 0 20px 0",
  fontFamily: "Georgia, serif",
};

const subheading = {
  color: "#2d4a3e",
  fontSize: "18px",
  fontWeight: "400",
  margin: "0 0 15px 0",
  fontFamily: "Georgia, serif",
};

const paragraph = {
  color: "#4a4a4a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 15px 0",
};

const orderBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  marginTop: "20px",
};

const trackingBox = {
  backgroundColor: "#e8f5e9",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
};

const trackingLabel = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 5px 0",
};

const trackingNumber_style = {
  color: "#2d4a3e",
  fontSize: "20px",
  fontWeight: "600",
  fontFamily: "monospace",
  margin: "0 0 15px 0",
};

const trackButton = {
  backgroundColor: "#2d4a3e",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const labelText = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 5px 0",
};

const valueText = {
  color: "#2d4a3e",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
};

const itemRow = {
  padding: "12px 0",
  borderBottom: "1px solid #eee",
};

const itemDetails = {
  verticalAlign: "top" as const,
};

const itemName = {
  color: "#2d4a3e",
  fontSize: "15px",
  fontWeight: "500",
  margin: "0 0 4px 0",
};

const itemVariant = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
};

const itemQuantityCol = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
  width: "60px",
};

const itemQuantity = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const addressText = {
  color: "#4a4a4a",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "0",
};

const footer = {
  backgroundColor: "#ffffff",
  padding: "30px 40px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 10px 0",
};

const footerSmall = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "20px 0 0 0",
};

const link = {
  color: "#2d4a3e",
  textDecoration: "underline",
};

export default ShippingConfirmationEmail;
