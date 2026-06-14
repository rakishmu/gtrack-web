import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import logo from '../../../public/logo.webp';

const AppHeader = () => {
  const socket = useSelector((state) => state.session.socket);
  const live = socket !== false; // tersambung WebSocket → "Live"
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: 1300, // di atas peta & drawer Traccar
        background: 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)',
        boxShadow: '0 4px 20px rgba(30,140,134,0.45)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', overflow: 'hidden',
            }}
          >
            <Box component="img" src={logo} sx={{ width:'100%',height:'100%',objectFit:'contain',p:0.5 }}/>
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: 15, sm: 19 }, lineHeight: 1.1 }}>
              Pusat Kendali Kinerja Alsintan
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              Kementerian Pertanian RI
            </Typography>
          </Box>
        </Box>

        {/* Kanan: badge live + jam */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              backgroundColor: live ? '#27AE60' : '#EF6C4A',
              color: '#fff', px: 2, py: 0.75, borderRadius: 999,
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            <FiberManualRecordIcon sx={{ fontSize: 10 }} />
            {live ? 'Live Data' : 'Offline'}
          </Box>
          <Typography sx={{ display: { xs: 'none', md: 'block' }, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 11 }}>
            {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;