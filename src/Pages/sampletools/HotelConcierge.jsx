// Import React for component functionality
import React from "react";
// Import Material-UI components for UI layout and styling
import { Box, Container, Typography, TextField, IconButton, Button, Fade } from "@mui/material";
// Import Material-UI icons
import SendIcon from "@mui/icons-material/Send";
// Import WhatsApp icon for contact button
import { IoLogoWhatsapp } from "react-icons/io5";
// Import custom components
import NavBar from "../../Components/NavBar";
import Footer from "../../Components/Footer";
import Excollo3DCaseStudy from "../../Components/AboutUs/Excollo3DCaseStudy";

/**
 * HotelConcierge Component
 * Interactive demo showcasing hotel concierge AI capabilities
 * Features a chat interface that simulates hotel concierge services
 * @returns {JSX.Element} Complete demo page with chat interface and animations
 */
const HotelConcierge = () => {
  // State for chat messages and conversation history
  const [messages, setMessages] = React.useState([]);
  // State for current input message
  const [input, setInput] = React.useState("");
  // State for loading indicator during API calls
  const [isLoading, setIsLoading] = React.useState(false);
  // State for WhatsApp button visibility based on scroll
  const [showWhatsAppButton, setShowWhatsAppButton] = React.useState(false);
  // Ref for input field focus management
  const inputRef = React.useRef(null);
  
  // State for user IP address (for analytics/tracking)
  const [userIP, setUserIP] = React.useState(null);

  // Fetch user's IP address on component mount and scroll to top
  React.useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    const fetchUserIP = async () => {
      try {
        // Check if IP is already stored in localStorage
        let storedIP = localStorage.getItem('user-ip-address');
        
        if (!storedIP) {
          // Fetch IP from a public IP service
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          storedIP = data.ip;
          localStorage.setItem('user-ip-address', storedIP);
        }
        
        setUserIP(storedIP);
      } catch (error) {
        console.error('Failed to fetch IP address:', error);
        // Fallback to a default value if IP fetch fails
        const fallbackIP = `unknown_${Date.now()}`;
        setUserIP(fallbackIP);
        localStorage.setItem('user-ip-address', fallbackIP);
      }
    };

    fetchUserIP();
  }, []);

  // WhatsApp button scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setShowWhatsAppButton(true);
      } else {
        setShowWhatsAppButton(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleWhatsapp = () => {
    window.open(
      "https://wa.me/918890204938?text=Hey%2C%20I%20need%20help%20with%20a%20tech%20solution.%20Let's%20talk%21",
      "_blank"
    );
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Use proxy in development, direct URL in production
      const webhookUrl = import.meta.env.DEV 
        ? '/api/webhook' 
        : 'https://n8n-excollo.azurewebsites.net/webhook/d4c39176-8d30-491c-88ed-9be5a1d55a0e';
      
      // Use POST request since webhook is configured for POST
      const requestBody = {
        message: trimmed,
        text: trimmed,
        input: trimmed,
        query: trimmed,
        sessionId: userIP || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Get the response as text first, then try to parse as JSON
      const rawResponseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        // If it's not JSON, treat the text as the message
        data = { message: rawResponseText };
      }
      
      // Try multiple possible response field names
      const finalResponseText = data.response || data.message || data.text || data.reply || data.answer || data.output || rawResponseText;
      
      const assistantMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: finalResponseText || "I received your message and I'm here to help!" 
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error calling webhook:', error);
      const errorMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const ChatBox = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 500 }}>
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        minHeight: 400
      }}>
        {messages.map((m) => (
          <Box key={m.id} sx={{ 
            display: 'flex', 
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <Box
              sx={{
                maxWidth: '75%',
                minWidth: 'fit-content',
                px: 2.5,
                py: 2,
                borderRadius: 3,
                background: m.role === 'user' 
                  ? 'linear-gradient(135deg, rgba(126, 34, 206, 0.3) 0%, rgba(126, 34, 206, 0.2) 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                border: m.role === 'user' 
                  ? '1px solid rgba(126, 34, 206, 0.4)' 
                  : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 15,
                lineHeight: 1.5,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: m.role === 'user' 
                  ? '0 4px 12px rgba(126, 34, 206, 0.2)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              {m.text}
            </Box>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <Box
              sx={{
                maxWidth: '75%',
                minWidth: 'fit-content',
                px: 2.5,
                py: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Box sx={{ 
                width: 12, 
                height: 12, 
                border: '2px solid rgba(126, 34, 206, 0.3)', 
                borderTop: '2px solid #7e22ce', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
              Typing...
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ 
        display: 'flex', 
        p: { xs: 2.5, md: 3 }, 
        gap: 2, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '0 0 12px 12px'
      }}>
        <TextField
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading && input.trim()) {
                handleSend();
              }
            }
          }}
          placeholder="Type your message here..."
          fullWidth
          size="medium"
          variant="outlined"
          disabled={isLoading}
          InputProps={{
            sx: {
              color: '#fff',
              fontSize: 15,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
              '& .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(126, 34, 206, 0.6)' 
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                borderColor: '#7e22ce',
                borderWidth: 2
              },
              '&.Mui-disabled': { 
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.02)',
                '& .MuiOutlinedInput-notchedOutline': { 
                  borderColor: 'rgba(255,255,255,0.1)' 
                }
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                '&::placeholder': {
                  color: 'rgba(255,255,255,0.5)',
                  opacity: 1
                }
              }
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          sx={{ 
            background: isLoading 
              ? 'rgba(126, 34, 206, 0.3)' 
              : 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)', 
            borderRadius: 2,
            width: 48,
            height: 48,
            boxShadow: isLoading 
              ? 'none' 
              : '0 4px 12px rgba(126, 34, 206, 0.3)',
            '&:hover': { 
              background: isLoading 
                ? 'rgba(126, 34, 206, 0.3)' 
                : 'linear-gradient(135deg, #6b21a8 0%, #5b1a96 100%)',
              transform: isLoading ? 'none' : 'translateY(-1px)',
              boxShadow: isLoading 
                ? 'none' 
                : '0 6px 16px rgba(126, 34, 206, 0.4)'
            },
            '&:disabled': { 
              background: 'rgba(126, 34, 206, 0.2)',
              opacity: 0.5,
              transform: 'none',
              boxShadow: 'none'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <SendIcon sx={{ color: '#fff', fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
  return (
    <Box sx={{ minHeight: "100vh", background: "#000", color: "#fff", position: 'relative' }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "88%",
          height: { xs: "10%", md: "10%" },
          background: `radial-gradient(ellipse at top, rgba(154, 106, 255, 0.6) 0%, rgba(0, 0, 0, 0) 60%)`,
          zIndex: 1,
          opacity: 1,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 3 }}>
        <NavBar />
      </Box>

      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography 
          sx={{ 
            fontWeight: 800, 
            fontSize: { xs: 32, sm: 40, md: 62 },
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            mb: { xs: 2, md: 3 }
          }}
        >
          Hotel{' '}
          <Box component="span" sx={{
            background: 'linear-gradient(180deg, #2579E3 0%, #8E54F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Concierge
          </Box>
        </Typography>
        <Typography sx={{ 
          mb: { xs: 4, md: 6 }, 
          color: 'rgba(255,255,255,0.85)', 
          maxWidth: 900, 
          textAlign: 'center', 
          mx: 'auto',
          fontSize: { xs: 14, sm: 16 },
          lineHeight: 1.6
        }}>
          The Hotel Concierge AI is a virtual extension of a hotel's front desk, built to deliver personalized hospitality at scale. Guests can use it to book dining, request services, plan activities, or explore local attractions, all aligned with the hotel's offerings.
        </Typography>
        
        {/* Chat Interface */}
        <Box sx={{
          mx: 'auto',
          width: '100%',
          maxWidth: 900,
          border: '1px solid rgba(126, 34, 206, 0.2)',
          borderRadius: 3,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(126, 34, 206, 0.1)',
          mb: { xs: 4, md: 6 }
        }}>
          <ChatBox />
        </Box>
      </Container>

      {/* Excollo 3D Logo */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box 
          sx={{ 
            mt: { xs: 2, md: 2 },
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

// Export the HotelConcierge component as default
export default HotelConcierge;


