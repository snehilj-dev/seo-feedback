import React from "react";
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import NavBar from "../Components/NavBar";

const ProductPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        height: "100vh", // Fixed height to prevent scrolling
        width: "100%",
        position: "relative",
        overflow: "hidden", // Prevent scrolling
        // Create starry background effect with subtle purple-to-blue radial gradient
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.15), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.1), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.12), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.08), transparent),
          radial-gradient(1px 1px at 160px 30px, rgba(255, 255, 255, 0.1), transparent),
          radial-gradient(1px 1px at 200px 60px, rgba(255, 255, 255, 0.06), transparent),
          radial-gradient(1px 1px at 240px 20px, rgba(255, 255, 255, 0.09), transparent),
          radial-gradient(1px 1px at 280px 90px, rgba(255, 255, 255, 0.07), transparent),
          radial-gradient(1px 1px at 320px 50px, rgba(255, 255, 255, 0.11), transparent),
          radial-gradient(1px 1px at 360px 80px, rgba(255, 255, 255, 0.05), transparent),
          radial-gradient(ellipse at center right, rgba(142, 84, 247, 0.08) 0%, rgba(37, 121, 227, 0.04) 50%, transparent 100%)
        `,
        backgroundSize:
          "400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 400px 200px, 100% 100%",
        backgroundRepeat:
          "repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, no-repeat",
        backgroundPosition:
          "0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, center right",
      }}
    >
      {/* Use existing NavBar component */}
      <NavBar />

      {/* Main Content Container */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          height: "100vh", // Fixed height to prevent scrolling
          padding: { xs: 1, sm: 1.5, md: 2, lg: 1.5 },
          paddingTop: { xs: "60px", sm: "70px", md: "80px", lg: "60px" },
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          overflow: "hidden", // Prevent scrolling
        }}
      >
        {/* CRUDO Logo */}
        <Box
          sx={{
            paddingBottom: { xs: "16px", sm: "20px", md: "24px", lg: "40px" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <a
            href="https://www.crudo.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <img
              src="/CRUDO.png"
              alt="CRUDO"
              style={{
                width: isMobile ? "180px" : isTablet ? "220px" : "180px",
                height: "auto",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              loading="lazy"
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            />
          </a>
        </Box>

        {/* Main Headline */}
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: "#ffffff",
            fontWeight: 700,
            fontSize: {
              xs: "clamp(1.25rem, calc(1rem + 1.5vw), 2rem)",
              sm: "clamp(1.5rem, calc(1.25rem + 1.5vw), 2.5rem)",
              md: "clamp(1.75rem, calc(1.5rem + 1.5vw), 3rem)",
              lg: "clamp(2rem, calc(1.75rem + 1.5vw), 3.5rem)",
              xl: "clamp(2.25rem, calc(2rem + 1.5vw), 4rem)",
            },
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: { xs: 0.5, sm: 1, md: 1.5, lg: 2 },
            maxWidth: {
              xs: "100%",
              sm: "95%",
              md: "90%",
              lg: "80%",
              xl: "75%",
            },
          }}
        >
          Your ICP, On-Demand:
          <br />
          <span style={{ fontSize: "0.9em" }}>AI Personas to</span>
          <br />
          Accelerate Messaging and
          <br />
          GTM
        </Typography>

        {/* Descriptive Paragraph */}
        <Typography
          variant="body1"
          sx={{
            color: "#ffffff",
            fontSize: {
              xs: "clamp(0.75rem, calc(0.625rem + 0.3vw), 1rem)",
              sm: "clamp(0.875rem, calc(0.75rem + 0.3vw), 1.125rem)",
              md: "clamp(1rem, calc(0.875rem + 0.3vw), 1.25rem)",
              lg: "clamp(1.125rem, calc(1rem + 0.3vw), 1.375rem)",
              xl: "clamp(1.25rem, calc(1.125rem + 0.3vw), 1.5rem)",
            },
            lineHeight: 1.6,
            maxWidth: {
              xs: "100%",
              sm: "95%",
              md: "90%",
              lg: "85%",
              xl: "80%",
            },
            marginBottom: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
            opacity: 0.95,
          }}
        >
          CRUDO.AI creates hyper-realistic AI personas of your Ideal Customer
          Profile (ICP), so your teams can instantly test messaging, validate
          positioning, and accelerate go-to-market decisions, all without
          waiting on real prospects.
        </Typography>

        {/* CTA Button */}
        <Button
          component="a"
          href="https://www.crudo.ai"
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          sx={{
            color: "#ffffff",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "40px", // Match your LET'S TALK button
            padding: {
              xs: "10px 18px",
              sm: "12px 22px",
              md: "14px 26px",
              lg: "16px 30px",
            },
            fontSize: {
              xs: "clamp(0.75rem, calc(0.625rem + 0.3vw), 1rem)",
              sm: "clamp(0.875rem, calc(0.75rem + 0.3vw), 1.125rem)",
              md: "clamp(1rem, calc(0.875rem + 0.3vw), 1.25rem)",
              lg: "clamp(1.125rem, calc(1rem + 0.3vw), 1.375rem)",
            },
            fontWeight: "100", // Match your LET'S TALK button weight
            textTransform: "none",
            position: "relative",
            minWidth: { xs: "180px", sm: "200px", md: "220px" },
            transition: "all 0.3s ease",
            textDecoration: "none",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              padding: "2px", // Same border thickness as LET'S TALK
              background:
                "linear-gradient(180deg, rgba(170, 63, 255, 0.9) 0%, rgba(94, 129, 235, 0.9) 100%)",
              borderRadius: {
                xs: "40px",
                sm: "40px",
                md: "40px",
                lg: "40px",
                xl: "50px",
              },
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              zIndex: -1,
            },
            "&:hover": {
              "&::before": {
                background:
                  "linear-gradient(180deg, rgba(170, 63, 255, 0.9) 0%, rgba(94, 129, 235, 0.9) 100%)",
              },
              background:
                "linear-gradient(180deg, rgba(170, 63, 255, 0.9) 0%, rgba(94, 129, 235, 0.9) 100%)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          Check Crudo Out
        </Button>
      </Box>
    </Box>
  );
};

export default ProductPage;
