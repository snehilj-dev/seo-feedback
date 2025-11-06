// Import React for component functionality
import React, { useState } from "react";
// Import Material-UI components for UI layout and styling
import { Box, Container, Typography, TextField, IconButton, Button, Fade } from "@mui/material";
// Import Material-UI icons
import SearchIcon from "@mui/icons-material/Search";
// Import WhatsApp icon for contact button
import { IoLogoWhatsapp } from "react-icons/io5";
// Import custom components
import NavBar from "../../Components/NavBar";
import Footer from "../../Components/Footer";
import Excollo3DCaseStudy from "../../Components/AboutUs/Excollo3DCaseStudy";

/**
 * SEOFeedback Component
 * Interactive demo showcasing SEO analysis and feedback AI capabilities
 * Features URL input, SEO analysis, and improvement suggestions
 * @returns {JSX.Element} Complete demo page with SEO analysis interface
 */
const SEOFeedback = () => {
  // State for search input
  const [searchInput, setSearchInput] = React.useState("");
  // State for feedback display visibility
  const [showFeedback, setShowFeedback] = React.useState(false);
  // State for WhatsApp button visibility based on scroll
  const [showWhatsAppButton, setShowWhatsAppButton] = React.useState(false);

  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Use local proxy to avoid CORS and client timeouts. Start with `npm run start:proxy`.
  const webhookUrl = `${import.meta.env.WEBHOOK_URL}/seo-feedback` || "http://localhost:3001/seo-feedback";
  const statusUrl = `${import.meta.env.WEBHOOK_URL}/seo-feedback/status` || "http://localhost:3001/seo-feedback/status";

  // Function to check execution status
  const checkExecutionStatus = async (executionId) => {
    try {
      const response = await fetch(`${statusUrl}/${executionId}`);
      const data = await response.json();
      console.log('Execution status:', data);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check status');
      }

      return data;
    } catch (err) {
      console.error('Status check failed:', err);
      throw err;
    }
  };

  // Start polling for results
  const startPolling = (executionId) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const status = await checkExecutionStatus(executionId);
        console.log('Polled execution status:', status);
        setExecutionStatus(status);

        if (status.status !== 'processing') {
          console.log('Polling complete, final status:', status);
          clearInterval(interval);
          setPollingInterval(null);

          if (status.status === 'completed') {
            setResponseData(status);
            console.log('Final response data:', status);
            setLoading(false);
          } else if (status.status === 'error') {
            throw new Error(status.message || 'Execution failed');
          }
        }
      } catch (err) {
        clearInterval(interval);
        setPollingInterval(null);
        setError(err.message);
        setLoading(false);
      }
    }, 5000); // Check every 5 seconds

    setPollingInterval(interval);
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");
    setExecutionStatus(null);
    setResponseData(null);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      console.log('Webhook response:', data);
      console.log('Webhook response status:', data[0].status);
      // console.log(data.Accept)
      if (data[0].status === 'processing' && data[0].executionId) {
        setExecutionStatus(data);
        console.log('Starting polling for execution ID:', data[0].executionId);
        startPolling(data[0].executionId);
        setSubmitted(url);
        setUrl("");
      }
      else if (data && data[0].pdfBlob) {
        setResponseData({ pdfBlob: data[0].pdfBlob });
        setSubmitted(url);
        setUrl("");
      }
      else if (data && (data[0].pdfBase64 || data[0].pdf_base64 || data[0].pdf)) {
        const base64 = data[0].pdfBase64 || data[0].pdf_base64 || data[0].pdf;
        setResponseData({ pdfBase64: base64, raw: data });
        setSubmitted(url);
        setUrl("");
      }
      else {
        setResponseData({ raw: data });
        console.log('Received raw data response:', data);
        setSubmitted(url);
        console.log('Submitted URL:', url);
        setUrl("");
      }
    } catch (err) {
      console.error("Error calling webhook:", err);
      setError(err.message || "Failed to submit URL. Please try again.");
    } finally {
      setLoading(false);
    }

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  // WhatsApp button scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) { setShowWhatsAppButton(true); }
      else { setShowWhatsAppButton(false); }
    };
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("scroll", handleScroll); };
  }, []);

  const handleWhatsapp = () => {
    window.open(
      "https://wa.me/918890204938?text=Hey%2C%20I%20need%20help%20with%20a%20tech%20solution.%20Let's%20talk%21",
      "_blank"
    );
  };
  function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function handleDownload() {
    if (!responseData) return;
    // First: try to find a URL in the webhook response and open it
    const source = responseData.raw || responseData;

    function findUrl(value) {
      if (!value) return null;
      // If it's a string and looks like a URL, return it
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
      }

      // If it's an array, search items
      if (Array.isArray(value)) {
        for (const item of value) {
          const res = findUrl(item);
          if (res) return res;
        }
      }

      // If it's an object, search common keys first then values
      if (typeof value === 'object') {
        const commonKeys = ['url', 'pdfUrl', 'downloadUrl', 'resultUrl', 'fileUrl', 'link', 'location', 'redirect', 'href', 'download_url', 'file_url'];
        for (const k of commonKeys) {
          if (k in value && value[k]) {
            const res = findUrl(value[k]);
            if (res) return res;
          }
        }

        // fallback: search all properties
        for (const k of Object.keys(value)) {
          try {
            const res = findUrl(value[k]);
            if (res) return res;
          } catch (e) {
            // ignore circulars
          }
        }
      }

      return null;
    }

    const foundUrl = findUrl(source);
    if (foundUrl) {
      // Open in a new tab/window
      try {
        window.open(foundUrl, '_blank', 'noopener,noreferrer');
        return;
      } catch (err) {
        console.error('Failed to open URL:', err);
      }
    }

    // If no URL found, preserve previous behavior: download PDF if present, else base64 PDF, else JSON
    // Case 1: webhook returned a PDF blob directly
    if (responseData.pdfBlob) {
      downloadBlob(responseData.pdfBlob, 'seo-feedback.pdf');
      return;
    }

    // Case 2: webhook returned a base64-encoded PDF inside JSON
    if (responseData.pdfBase64) {
      try {
        // convert base64 to Uint8Array
        const b64 = responseData.pdfBase64;
        const binary = atob(b64);
        const len = binary.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          u8[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([u8], { type: 'application/pdf' });
        downloadBlob(blob, 'seo-feedback.pdf');
        return;
      } catch (err) {
        console.error('Failed to convert base64 PDF:', err);
      }
    }

    // Fallback: download JSON result (no PDF available)
    try {
      const blob = new Blob([JSON.stringify(source || responseData, null, 2)], {
        type: 'application/json'
      });
      downloadBlob(blob, 'seo-feedback.json');
    } catch (err) {
      console.error('Failed to download results:', err);
      setError('Failed to prepare download.');
    }
  }
  return (
    <Box sx={{ minHeight: "100vh", background: "#000", color: "#fff", position: 'relative' }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: { xs: "100%", md: "88%" },
          height: { xs: "120px", sm: "140px", md: "160px" },
          background: `radial-gradient(ellipse at top, rgba(154, 106, 255, 0.6) 0%, rgba(0, 0, 0, 0) 60%)`,
          zIndex: 1,
          opacity: 1
        }}
      />

      <Box sx={{ position: "relative", zIndex: 3 }}> <NavBar /> </Box>

      <Container
        maxWidth="xl"
        sx={{
          pt: { xs: 4, sm: 6, md: 10 },
          px: { xs: 1, sm: 2, md: 3 },
          position: 'relative',
          zIndex: 2
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: 28, sm: 36, md: 48, lg: 62 },
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            lineHeight: { xs: 1.1, sm: 1.2 },
            mb: { xs: 1, sm: 2 }
          }}
        >
          SEO{' '}
          <Box component="span" sx={{
            background: 'linear-gradient(180deg, #2579E3 0%, #8E54F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Feedback
          </Box>
        </Typography>

        <Typography
          sx={{
            mt: { xs: 1, sm: 2 },
            color: 'rgba(255,255,255,0.85)',
            maxWidth: { xs: '100%', sm: 800, md: 900 },
            textAlign: { xs: 'left', sm: 'justify' },
            mx: 'auto',
            fontSize: { xs: 14, sm: 16 },
            lineHeight: { xs: 1.4, sm: 1.6 },
            px: { xs: 1, sm: 0 }
          }}
        >
          The Hotel Concierge AI is a virtual extension of a hotel's front desk, built to deliver personalized hospitality at scale. Guests can use it to book dining, request services, plan activities, or explore local attractions, all aligned with the hotel's offerings. Simply share preferences or special requests.
        </Typography>

        {/* Search Interface */}
        <Box sx={{
          mt: { xs: 3, sm: 4, md: 5 },
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 1, sm: 0 }
        }}>
          <Box sx={{
            display: 'flex',
            maxWidth: 600,
            width: '100%',
            gap: 1
          }}>
            <TextField
              // value={searchInput}
              value={url}
              // onChange={(e) => setSearchInput(e.target.value)}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter URL"
              fullWidth
              variant="outlined"
              InputProps={{
                sx: {
                  color: '#fff',
                  fontSize: { xs: 14, sm: 16 },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7e22ce'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#7e22ce'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                    opacity: 1
                  }
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSearch}
              // disabled={!searchInput.trim()}
              disabled={!url.trim()}
              sx={{
                background: '#7e22ce',
                minWidth: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                '&:hover': { background: '#6b21a8' },
                '&:disabled': {
                  background: 'rgba(126, 34, 206, 0.3)',
                  opacity: 0.5
                }
              }}
            >
              <SearchIcon sx={{ color: '#fff', fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Box>
        </Box>

        {/* Feedback Box */}
        {submitted && (
          <Box sx={{
            mt: { xs: 3, sm: 4, md: 5 },
            mx: 'auto',
            width: '100%',
            maxWidth: { xs: '100%', sm: 800, md: 1000 },
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(126, 34, 206, 0.3)',
            borderRadius: 2,
            p: { xs: 2, sm: 3, md: 4 }
          }}>
            <Typography sx={{
              fontSize: { xs: 18, sm: 20, md: 24 },
              fontWeight: 600,
              color: '#7e22ce',
              mb: 3,
              textAlign: 'center'
            }}>
              Feedback
            </Typography>
            <div className="submitted">
              <strong>Submitted URL:</strong>
              <div className="submitted-url">{submitted}</div>
              {(loading || executionStatus?.status === 'processing') && (
                <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', my: 2 }}>
                  <Typography>{executionStatus?.status === 'processing' ? 'Processing SEO analysis...' : 'Submitting request...'}</Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.6)' }}>
                    {executionStatus?.message || 'This may take a few minutes'}
                  </Typography>
                </Box>
              )}
              {error && (
                <Box sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: 'rgba(220,38,38,0.1)',
                  border: '1px solid rgba(220,38,38,0.2)'
                }}>
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Box>
              )}
              {responseData && !loading && (
                <div className="download-section">
                  <Button
                    onClick={handleDownload}
                    variant="contained"
                    sx={{
                      mt: 2,
                      background: 'linear-gradient(180deg, #2579E3 0%, #8E54F7 100%)',
                      '&:hover': {
                        background: 'linear-gradient(180deg, #1d60b8 0%, #7543d1 100%)'
                      }
                    }}
                    startIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    }
                  >
                    Download Results
                  </Button>
                </div>
              )}
            </div>
          </Box>
        )}
      </Container>

      {/* Excollo 3D Logo */}
      <Container
        maxWidth="xl"
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
          mt: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Box
          sx={{
            mt: { xs: 1, md: 2 },
            mb: { xs: 0, md: 0 },
            position: 'relative',
            zIndex: 1,
            background: '#000'
          }}
        >
          <Excollo3DCaseStudy disableScroll />
        </Box>
      </Container>

      <Footer />

      <Fade in={showWhatsAppButton}>
        <Button
          onClick={handleWhatsapp}
          variant="contained"
          color="primary"
          sx={{
            position: "fixed",
            height: 60,
            bottom: { xs: 200, md: 100 },
            right: { xs: 24, md: 24 },
            zIndex: 1000,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              background: "linear-gradient(180deg, #2579E3 0%, #8E54F7 100%)",
            },
          }}
        >
          <IoLogoWhatsapp size={30} />
        </Button>
      </Fade>
    </Box>
  );
};

// Export the SEOFeedback component as default
export default SEOFeedback;