import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Paper, Button, TextField, InputAdornment,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const TEAL = 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)';

const MOCK_SMS = [
  { id: 1, type: 'SMS Device', content: 'Halo, unit Anda perlu servis.', group: 'Brigade Pangan', number: '0812xxxxxx', date: '2026-06-10 09:12' },
  { id: 2, type: 'SMS Media', content: 'Info pemeliharaan rutin.', group: 'UPJA', number: 'Multiple (24)', date: '2026-06-11 14:30' },
];
const DEVICES = ['TRAKTOR RODA 4 - 01', 'TRAKTOR RODA 2 - 07', 'COMBINE - 03'];
const TOPICS = ['Pemeliharaan', 'Peringatan', 'Informasi Umum'];
const RECIPIENT_GROUPS = ['Brigade Pangan', 'Brigade Dinas', 'Gapoktan', 'UPJA'];

export default function CommandPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows] = useState(MOCK_SMS);
  const [open, setOpen] = useState(false);

  const filtered = rows.filter((r) =>
    [r.type, r.content, r.group, r.number, r.date].join(' ').toLowerCase().includes(query.toLowerCase()));
  const paged = filtered.slice(page * 10, page * 10 + 10);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7f7' }}>
      <AppBar position="static" sx={{ background: TEAL }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" fontWeight={800}>Command Center</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Box>
              <Typography fontWeight={800}>Daftar SMS</Typography>
              <Typography variant="caption" color="text.secondary">Ada 2 tipe: SMS Device / SMS Media</Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <TextField size="small" placeholder="Cari…" value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ background: TEAL, fontWeight: 700 }}>
                Create SMS
              </Button>
            </Stack>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                {['SMS Type', 'Content Message', 'Group Recipient', 'Nomer Recipient', 'Tanggal SMS'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length ? paged.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><Chip size="small" label={r.type} color={r.type === 'SMS Media' ? 'secondary' : 'primary'} /></TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>{r.content}</TableCell>
                  <TableCell>{r.group}</TableCell>
                  <TableCell>{r.number}</TableCell>
                  <TableCell>{r.date}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>Belum ada data SMS.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={10} rowsPerPageOptions={[10]} />
        </Paper>
      </Box>

      <CreateSmsDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

function CreateSmsDialog({ open, onClose }) {
  const [tab, setTab] = useState(0);
  const [device, setDevice] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [groups, setGroups] = useState([]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Create SMS</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label="SMS Device" />
        <Tab label="SMS Media" />
      </Tabs>
      <DialogContent dividers>
        {tab === 0 ? (
          <Stack spacing={2}>
            <TextField select label="Device" value={device} onChange={(e) => setDevice(e.target.value)} fullWidth>
              {DEVICES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={4} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField select label="Topic Media" value={topic} onChange={(e) => setTopic(e.target.value)} fullWidth>
              {TOPICS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Message" value={message} onChange={(e) => setMessage(e.target.value)} fullWidth multiline minRows={4} />
            <TextField select label="Group of Recipient (blast ke multiple nomer)" value={groups}
              onChange={(e) => setGroups(e.target.value)} fullWidth
              SelectProps={{ multiple: true, renderValue: (s) => s.join(', ') }}>
              {RECIPIENT_GROUPS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onClose} sx={{ background: TEAL, fontWeight: 700 }}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}