import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
  price: number;
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

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  orderDate: string;
}

function formatPrice(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shippingCost,
  discountAmount,
  total,
  shippingAddress,
  shippingMethod,
  orderDate,
}: OrderConfirmationEmailProps) {
  const previewText = `Order Confirmation - ${orderNumber}`;

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

          {/* Order Confirmation */}
          <Section style={content}>
            <Heading style={heading}>Thank You for Your Order!</Heading>
            <Text style={paragraph}>
              Hi {customerName || "there"},
            </Text>
            <Text style={paragraph}>
              We&apos;ve received your order and are preparing it with care.
              You&apos;ll receive another email when your order ships.
            </Text>

            {/* Order Details Box */}
            <Section style={orderBox}>
              <Row>
                <Column>
                  <Text style={labelText}>Order Number</Text>
                  <Text style={valueText}>{orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={labelText}>Order Date</Text>
                  <Text style={valueText}>{orderDate}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Order Items */}
          <Section style={content}>
            <Heading as="h2" style={subheading}>Items Ordered</Heading>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemDetails}>
                  <Text style={itemName}>{item.productName}</Text>
                  {item.colorway && item.colorway !== item.productName && (
                    <Text style={itemVariant}>{item.colorway}</Text>
                  )}
                  <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPrice}>
                  <Text style={priceText}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={hrLight} />

            {/* Order Summary */}
            <Row style={summaryRow}>
              <Column style={summaryLabel}>
                <Text style={summaryText}>Subtotal</Text>
              </Column>
              <Column style={summaryValue}>
                <Text style={summaryText}>{formatPrice(subtotal)}</Text>
              </Column>
            </Row>

            {discountAmount > 0 && (
              <Row style={summaryRow}>
                <Column style={summaryLabel}>
                  <Text style={discountText}>Discount</Text>
                </Column>
                <Column style={summaryValue}>
                  <Text style={discountText}>-{formatPrice(discountAmount)}</Text>
                </Column>
              </Row>
            )}

            <Row style={summaryRow}>
              <Column style={summaryLabel}>
                <Text style={summaryText}>Shipping ({shippingMethod})</Text>
              </Column>
              <Column style={summaryValue}>
                <Text style={summaryText}>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </Text>
              </Column>
            </Row>

            <Hr style={hrLight} />

            <Row style={summaryRow}>
              <Column style={summaryLabel}>
                <Text style={totalText}>Total</Text>
              </Column>
              <Column style={summaryValue}>
                <Text style={totalText}>{formatPrice(total)}</Text>
              </Column>
            </Row>
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
              Questions about your order? Reply to this email or contact us at{" "}
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
  margin: "0 0 4px 0",
};

const itemQuantity = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
};

const itemPrice = {
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const priceText = {
  color: "#2d4a3e",
  fontSize: "15px",
  margin: "0",
};

const summaryRow = {
  padding: "8px 0",
};

const summaryLabel = {
  textAlign: "left" as const,
};

const summaryValue = {
  textAlign: "right" as const,
};

const summaryText = {
  color: "#4a4a4a",
  fontSize: "14px",
  margin: "0",
};

const discountText = {
  color: "#059669",
  fontSize: "14px",
  margin: "0",
};

const totalText = {
  color: "#2d4a3e",
  fontSize: "18px",
  fontWeight: "600",
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

const hrLight = {
  borderColor: "#eee",
  margin: "15px 0",
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

export default OrderConfirmationEmail;
