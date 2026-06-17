import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppBar, Toolbar, Box, Typography, FormControl, Select, MenuItem } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import logo from '../../../public/logo.webp';

// Gradient memudar ke terang di kanan supaya judul gelap tetap terbaca.
const LEFT_TEAL = 'linear-gradient(110deg,#1E8C86 0%,#2BA8A2 45%,#5DC9C2 75%,#CFEDEA 100%)';

const selectStyle = {
  color: '#1E3A3A',
  height: 38,
  fontSize: 13,
  fontWeight: 600,
  backgroundColor: '#F5F9F9',
  borderRadius: '999px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(30,140,134,0.25)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(30,140,134,0.5)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1E8C86' },
  '& .MuiSvgIcon-root': { color: '#1E8C86' },
};

function RegionSelect({ label, value, items, disabled, onChange }) {
  return (
    <FormControl size="small" sx={{ minWidth: 150 }} disabled={disabled}>
      <Select
        value={value}
        displayEmpty
        onChange={onChange}
        sx={selectStyle}
        renderValue={(v) => {
          if (!v) return <span style={{ color: '#8AA0A0', fontWeight: 600 }}>{label}</span>;
          const it = items.find((g) => String(g.id) === String(v));
          return it ? it.name : label;
        }}
      >
        <MenuItem value=""><em>Semua {label}</em></MenuItem>
        {items.map((g) => (
          <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const AppHeader = ({ onRegionChange }) => {
  const socket = useSelector((state) => state.session.socket);
  const groupItems = useSelector((state) => state.groups.items || {});
  const allGroups = Object.values(groupItems);
  const live = socket !== false;

  const [provinsi, setProvinsi] = useState('');
  const [kabupaten, setKabupaten] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kelurahan, setKelurahan] = useState('');

  const listProvinsi = allGroups.filter((g) => !g.groupId || g.groupId === 0);
  const listKabupaten = allGroups.filter((g) => g.groupId === Number(provinsi));
  const listKecamatan = allGroups.filter((g) => g.groupId === Number(kabupaten));
  const listKelurahan = allGroups.filter((g) => g.groupId === Number(kecamatan));

  const handleRegionChange = (level, value) => {
    if (level === 'provinsi') {
      setProvinsi(value); setKabupaten(''); setKecamatan(''); setKelurahan('');
      onRegionChange?.(Number(value) || 0);
    } else if (level === 'kabupaten') {
      setKabupaten(value); setKecamatan(''); setKelurahan('');
      onRegionChange?.(Number(value) || Number(provinsi));
    } else if (level === 'kecamatan') {
      setKecamatan(value); setKelurahan('');
      onRegionChange?.(Number(value) || Number(kabupaten));
    } else if (level === 'kelurahan') {
      setKelurahan(value);
      onRegionChange?.(Number(value) || Number(kecamatan));
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ zIndex: 1300, background: '#fff', boxShadow: '0 4px 20px rgba(30,140,134,0.18)' }}
    >
      <Toolbar sx={{ position: 'relative', minHeight: 64, gap: 2 }}>
        {/* Latar teal kiri dengan tepi melengkung */}
        <Box
          sx={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: { xs: '72%', sm: '48%', md: '40%' },
            maxWidth: 520,
            background: LEFT_TEAL,
            clipPath: 'url(#appHeaderCurve)',
            zIndex: 0,
          }}
        />

        {/* Logo + judul (di atas latar) */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '14px',
              border: '2px solid rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}
          >
            <Box component="img" src={logo} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#1E3A3A', fontWeight: 800, fontSize: { xs: 14, sm: 17 }, lineHeight: 1.1 }}>
              Pusat Kendali Kinerja Alsintan
            </Typography>
            <Typography sx={{ color: '#3F5C5C', fontSize: 11, fontWeight: 500 }}>
              Kementerian Pertanian RI
            </Typography>
          </Box>
        </Box>

        {/* Kanan: dropdown wilayah + LIVE */}
        <Box sx={{ position: 'relative', zIndex: 1, ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 1.5 }}>
            <RegionSelect label="Provinsi" value={provinsi} items={listProvinsi} onChange={(e) => handleRegionChange('provinsi', e.target.value)} />
            <RegionSelect label="Kabupaten" value={kabupaten} items={listKabupaten} disabled={!provinsi} onChange={(e) => handleRegionChange('kabupaten', e.target.value)} />
            <RegionSelect label="Kecamatan" value={kecamatan} items={listKecamatan} disabled={!kabupaten} onChange={(e) => handleRegionChange('kecamatan', e.target.value)} />
            <RegionSelect label="Kelurahan" value={kelurahan} items={listKelurahan} disabled={!kecamatan} onChange={(e) => handleRegionChange('kelurahan', e.target.value)} />
          </Box>

          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              border: `1.5px solid ${live ? 'rgba(30,140,134,0.45)' : 'rgba(198,40,40,0.45)'}`,
              color: live ? '#1E8C86' : '#C62828',
              backgroundColor: live ? 'rgba(43,168,162,0.10)' : 'rgba(198,40,40,0.06)',
              px: 1.75, py: 0.6, borderRadius: 999,
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            <AutorenewIcon sx={{ fontSize: 14 }} />
            {live ? 'Live' : 'Offline'}
          </Box>
        </Box>

        {/* Bentuk tepi melengkung blok teal */}
        <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="appHeaderCurve" clipPathUnits="objectBoundingBox">
              <path d="M0,0 L0.82,0 C0.96,0.35 0.92,0.72 1,1 L0,1 Z" />
            </clipPath>
          </defs>
        </svg>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;