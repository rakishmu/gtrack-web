import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Paper, Button, TextField, InputAdornment,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, MenuItem, Switch, FormControlLabel,
  List, ListItemButton, ListItemText, Checkbox, Collapse, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const TEAL = 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)';
const ACCOUNT_TYPES = ['Nasional', 'Provinsi', 'Kabupaten', 'BP'];

const MOCK_USERS = [
  { id: 1, active: true, email: 'admin@kementan.go.id', type: 'Nasional', lastLogin: '2026-06-12 08:00' },
  { id: 2, active: true, email: 'jabar@kementan.go.id', type: 'Provinsi', lastLogin: '2026-06-11 16:20' },
  { id: 3, active: false, email: 'bp.indramayu@kementan.go.id', type: 'BP', lastLogin: '2026-05-30 10:05' },
];
const OBJECT_TREE = [
  { prov: 'JAWA BARAT', units: ['KAB. INDRAMAYU', 'KAB. BANDUNG', 'KOTA BANDUNG'] },
  { prov: 'JAWA TIMUR', units: ['KAB. MALANG', 'KOTA SURABAYA'] },
  { prov: 'BALI', units: ['KAB. BADUNG', 'KOTA DENPASAR'] },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows] = useState(MOCK_USERS);
  const [editing, setEditing] = useState(null); // null | user | 'new'

  const filtered = rows.filter((r) => [r.email, r.type].join(' ').toLowerCase().includes(query.toLowerCase()));
  const paged = filtered.slice(page * 10, page * 10 + 10);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7f7' }}>
      <AppBar position="static" sx={{ background: TEAL }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" fontWeight={800}>User Management</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1 }} flexWrap="wrap" gap={1}>
            <Box>
              <Typography fontWeight={800}>Daftar User</Typography>
              <Typography variant="caption" color="text.secondary">
                Level 1: Nasional · Level 2: Provinsi · Level 3: Kabupaten · Level 4: BP (Penerima Bantuan)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <TextField size="small" placeholder="Search…" value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing('new')} sx={{ background: TEAL, fontWeight: 700 }}>
                Add
              </Button>
            </Stack>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                {['Active', 'Email', 'Type Account', 'Last Login', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length ? paged.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell><Chip size="small" label={u.active ? 'Active' : 'Nonaktif'} color={u.active ? 'success' : 'default'} /></TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.type}</TableCell>
                  <TableCell>{u.lastLogin}</TableCell>
                  <TableCell align="right"><IconButton size="small" onClick={() => setEditing(u)}><EditIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>Belum ada user.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={10} rowsPerPageOptions={[10]} />
        </Paper>
      </Box>

      <UserDialog open={editing !== null} user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
    </Box>
  );
}

function UserDialog({ open, user, onClose }) {
  const [tab, setTab] = useState(0);
  const [active, setActive] = useState(user?.active ?? true);
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState(user?.type ?? 'Nasional');
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState({});

  const toggleUnit = (prov, unit) => {
    const key = `${prov}__${unit}`;
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth key={user?.id ?? 'new'}>
      <DialogTitle sx={{ fontWeight: 800 }}>{user ? 'Edit User' : 'Add User'}</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label="Main" />
        <Tab label="Object" />
      </Tabs>
      <DialogContent dividers>
        {tab === 0 ? (
          <Stack spacing={2}>
            <FormControlLabel control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />} label="Active" />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Nomer Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
            <TextField select label="Type Account" value={type} onChange={(e) => setType(e.target.value)} fullWidth>
              {ACCOUNT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Stack>
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pilih objek (grouping per Provinsi/Kabupaten). Bisa pilih satu unit.
            </Typography>
            <List dense sx={{ maxHeight: 320, overflow: 'auto', mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {OBJECT_TREE.map((grp) => (
                <Box key={grp.prov}>
                  <ListItemButton onClick={() => setExpanded((e) => ({ ...e, [grp.prov]: !e[grp.prov] }))}>
                    <ListItemText primary={grp.prov} primaryTypographyProps={{ fontWeight: 700 }} />
                    {expanded[grp.prov] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>
                  <Collapse in={!!expanded[grp.prov]} unmountOnExit>
                    {grp.units.map((u) => {
                      const key = `${grp.prov}__${u}`;
                      return (
                        <ListItemButton key={u} sx={{ pl: 4 }} onClick={() => toggleUnit(grp.prov, u)}>
                          <Checkbox edge="start" size="small" checked={selected.includes(key)} tabIndex={-1} disableRipple />
                          <ListItemText primary={u} />
                        </ListItemButton>
                      );
                    })}
                  </Collapse>
                  <Divider />
                </Box>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onClose} sx={{ background: TEAL, fontWeight: 700 }}>
          {tab === 1 ? 'Save As' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}