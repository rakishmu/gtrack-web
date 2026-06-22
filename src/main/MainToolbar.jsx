import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ListItemText,
  Badge,
  ListItemButton,
  ListItemText as MuiListItemText,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import DnsIcon from '@mui/icons-material/Dns';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import DeviceRow from './DeviceRow';

const API_BASE = 'https://api.garudatrack.id';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    width: theme.dimensions.drawerWidthTablet,
    maxHeight: '70vh',
    overflowY: 'auto',
  },
}));

const getYearOptions = (startYear = 2024, endYear = new Date().getFullYear()) => {
  const years = [];
  for (let y = startYear; y <= endYear; y += 1) {
    years.push(String(y));
  }
  return years;
};

// Helper: selalu kembalikan array, apapun input-nya (undefined, string, array)
const asArray = (value) => (Array.isArray(value) ? value : []);

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
  regionLock,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);

  const deviceStatusCount = (status) =>
    Object.values(devices).filter((d) => d.status === status).length;

  const filterTahun = asArray(filter.tahun);
  const filterJenis = asArray(filter.jenis);
  const filterProvinsi = asArray(filter.provinsi);
  const filterKabupaten = asArray(filter.kabupaten);
  const filterKecamatan = asArray(filter.kecamatan);
  const filterKelurahan = asArray(filter.kelurahan);

  const levels = ['PROVINSI', 'KABUPATEN_KOTA', 'KECAMATAN', 'KELURAHAN'];
  const lockIndex = regionLock ? levels.indexOf(regionLock.level) : -1;
  const isProvinsiLocked = lockIndex >= 0;
  const isKabupatenLocked = lockIndex >= 1;
  const isKecamatanLocked = lockIndex >= 2;
  const isKelurahanLocked = lockIndex >= 3;

  const tahunOptions = useMemo(() => getYearOptions(2024), []);

  const [jenisOptions, setJenisOptions] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/cards/jenisalsintan`)
      .then((res) => res.json())
      .then((data) => {
        setJenisOptions(
          (data || [])
            .map((item) => item.vehicle_name)
            .sort((a, b) => a.localeCompare(b)),
        );
      })
      .catch(() => setJenisOptions([]));
  }, []);

  // -- Provinsi: dari API --
  const [provinsiOptions, setProvinsiOptions] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/cluster/getprovince`)
      .then((res) => res.json())
      .then((data) => setProvinsiOptions(Array.isArray(data) ? data : []))
      .catch(() => setProvinsiOptions([]));
  }, []);

  // -- Kabupaten: cascading dari Provinsi terpilih --
  const [kabupatenOptions, setKabupatenOptions] = useState([]);
  useEffect(() => {
    if (filterProvinsi.length !== 1) {
      // API butuh 1 provinsi spesifik di path; kalau 0 atau >1 dipilih, kosongkan opsi
      setKabupatenOptions([]);
      return;
    }
    fetch(`${API_BASE}/cluster/getregency/${encodeURIComponent(filterProvinsi[0])}/`)
      .then((res) => res.json())
      .then((data) => setKabupatenOptions(Array.isArray(data) ? data : []))
      .catch(() => setKabupatenOptions([]));
  }, [filter.provinsi]);

  // -- Kecamatan: cascading dari Provinsi + Kabupaten terpilih --
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  useEffect(() => {
    if (filterProvinsi.length !== 1 || filterKabupaten.length !== 1) {
      setKecamatanOptions([]);
      return;
    }
    fetch(`${API_BASE}/cluster/getsubdistrict/${encodeURIComponent(filterKabupaten[0])}/`)
      .then((res) => res.json())
      .then((data) => setKecamatanOptions(Array.isArray(data) ? data : []))
      .catch(() => setKecamatanOptions([]));
  }, [filter.provinsi, filter.kabupaten]);

  // -- Kelurahan/Desa: cascading dari Kabupaten + Kecamatan terpilih --
  const [kelurahanOptions, setKelurahanOptions] = useState([]);
  useEffect(() => {
    if (filterKabupaten.length !== 1 || filterKecamatan.length !== 1) {
      setKelurahanOptions([]);
      return;
    }
    fetch(`${API_BASE}/cluster/getward/${encodeURIComponent(filterKabupaten[0])}/${encodeURIComponent(filterKecamatan[0])}/`)
      .then((res) => res.json())
      .then((data) => setKelurahanOptions(Array.isArray(data) ? data : []))
      .catch(() => setKelurahanOptions([]));
  }, [filter.kabupaten, filter.kecamatan]);

  // Reset child selections ketika parent berubah
  const handleProvinsiChange = (value) => {
    setFilter({
      ...filter,
      provinsi: asArray(value),
      kabupaten: [],
      kecamatan: [],
      kelurahan: [],
    });
  };

  const handleKabupatenChange = (value) => {
    setFilter({
      ...filter,
      kabupaten: asArray(value),
      kecamatan: [],
      kelurahan: [],
    });
  };

  const handleKecamatanChange = (value) => {
    setFilter({
      ...filter,
      kecamatan: asArray(value),
      kelurahan: [],
    });
  };

  const handleKelurahanChange = (value) => {
  setFilter({
    ...filter,
    kelurahan: asArray(value),
  });
};

  return (
    <Toolbar ref={toolbarRef} className={classes.toolbar}>
      <IconButton edge="start" onClick={() => setDevicesOpen(!devicesOpen)}>
        {devicesOpen ? <MapIcon /> : <DnsIcon />}
      </IconButton>
      <OutlinedInput
        ref={inputRef}
        placeholder={t('sharedSearchDevices')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
        onBlur={() => setDevicesAnchorEl(null)}
        endAdornment={
          <InputAdornment position="end">
            <IconButton size="small" edge="end" onClick={() => setFilterAnchorEl(inputRef.current)}>
              <Badge
                color="info"
                variant="dot"
                invisible={
                  !asArray(filter.statuses).length &&
                  !asArray(filter.groups).length &&
                  !asArray(filter.geofences).length &&
                  !filterTahun.length &&
                  !filterJenis.length &&
                  !filterProvinsi.length &&
                  !filterKabupaten.length &&
                  !filterKecamatan.length &&
                  !filterKelurahan.length
                }
              >
                <TuneIcon fontSize="small" sx={{ color: '#020000' }} />
              </Badge>
            </IconButton>
          </InputAdornment>
        }
        size="small"
        fullWidth
        sx={{
          backgroundColor: '#fff',
          borderRadius: 1.5,
          '& .MuiInputBase-input': { color: '#1E3A3A !important' },
        }}
      />
      <Popover
        open={!!devicesAnchorEl && !devicesOpen}
        anchorEl={devicesAnchorEl}
        onClose={() => setDevicesAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: Number(theme.spacing(2).slice(0, -2)),
        }}
        marginThreshold={0}
        slotProps={{
          paper: {
            style: { width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})` },
          },
        }}
        elevation={1}
        disableAutoFocus
        disableEnforceFocus
      >
        {filteredDevices.slice(0, 3).map((_, index) => (
          <DeviceRow key={filteredDevices[index].id} devices={filteredDevices} index={index} />
        ))}
        {filteredDevices.length > 3 && (
          <ListItemButton alignItems="center" onClick={() => setDevicesOpen(true)}>
            <MuiListItemText primary={t('notificationAlways')} style={{ textAlign: 'center' }} />
          </ListItemButton>
        )}
      </Popover>
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div className={classes.filterPanel}>
          <FormControl>
            <InputLabel>{t('deviceStatus')}</InputLabel>
            <Select
              label={t('deviceStatus')}
              value={asArray(filter.statuses)}
              onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
              multiple
            >
              <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
              <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
              <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
            </Select>
          </FormControl>


          {/* <FormControl>
            <InputLabel>{t('sharedGeofences')}</InputLabel>
            <Select
              label={t('sharedGeofences')}
              value={asArray(filter.geofences)}
              onChange={(e) => setFilter({ ...filter, geofences: e.target.value })}
              multiple
            >
              {Object.values(geofences)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((geofence) => (
                  <MenuItem key={geofence.id} value={geofence.id}>
                    {geofence.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl> */}

          {/* -- Tahun -- */}
          <FormControl size="small" fullWidth>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Tahun
            </InputLabel>
            <Select
              value={filterTahun}
              onChange={(e) => setFilter({ ...filter, tahun: e.target.value })}
              multiple
              displayEmpty
              renderValue={(selected) => (asArray(selected).length === 0 ? 'Semua Tahun' : asArray(selected).sort().join(', '))}
              sx={{ borderRadius: 2 }}
            >
              {tahunOptions.map((tahun) => (
                <MenuItem key={tahun} value={tahun}>
                  <Checkbox checked={filterTahun.indexOf(tahun) > -1} />
                  <ListItemText primary={tahun} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* -- Jenis Alsintan -- */}
          <FormControl size="small" fullWidth>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Jenis
            </InputLabel>
            <Select
              value={filterJenis}
              onChange={(e) => setFilter({ ...filter, jenis: e.target.value })}
              multiple
              displayEmpty
              renderValue={(selected) => (asArray(selected).length === 0 ? 'Semua Jenis' : asArray(selected).join(', '))}
              sx={{ borderRadius: 2 }}
            >
              {jenisOptions.map((jenis) => (
                <MenuItem key={jenis} value={jenis}>
                  <Checkbox checked={filterJenis.indexOf(jenis) > -1} />
                  <ListItemText primary={jenis} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* -- Provinsi -- */}
          <FormControl size="small" fullWidth disabled={isProvinsiLocked}>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Provinsi
            </InputLabel>
            <Select
              value={filterProvinsi[0] || ''}
              onChange={(e) => handleProvinsiChange(e.target.value ? [e.target.value] : [])}
              displayEmpty
              renderValue={(selected) => (selected ? selected : 'Pilih Provinsi...')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Pilih Provinsi...</em>
              </MenuItem>
              {provinsiOptions.map((provinsi) => (
                <MenuItem key={provinsi} value={provinsi}>
                  {provinsi}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* -- Kabupaten/Kota -- */}
          <FormControl size="small" fullWidth disabled={isKabupatenLocked || filterProvinsi.length !== 1}>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Kabupaten/Kota
            </InputLabel>
            <Select
              value={filterKabupaten[0] || ''}
              onChange={(e) => handleKabupatenChange(e.target.value ? [e.target.value] : [])}
              displayEmpty
              renderValue={(selected) => (selected ? selected : 'Pilih Kabupaten...')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Pilih Kabupaten...</em>
              </MenuItem>
              {kabupatenOptions.map((kabupaten) => (
                <MenuItem key={kabupaten} value={kabupaten}>
                  {kabupaten}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* -- Kecamatan -- */}
          <FormControl size="small" fullWidth disabled={isKecamatanLocked || filterKabupaten.length !== 1}>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Kecamatan
            </InputLabel>
            <Select
              value={filterKecamatan[0] || ''}
              onChange={(e) => handleKecamatanChange(e.target.value ? [e.target.value] : [])}
              displayEmpty
              renderValue={(selected) => (selected ? selected : 'Pilih Kecamatan...')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Pilih Kecamatan...</em>
              </MenuItem>
              {kecamatanOptions.map((kecamatan) => (
                <MenuItem key={kecamatan} value={kecamatan}>
                  {kecamatan}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* -- Kelurahan/Desa -- */}
          <FormControl size="small" fullWidth disabled={isKelurahanLocked || filterKecamatan.length !== 1}>
            <InputLabel
              shrink
              sx={{
                position: 'static', transform: 'none', fontSize: 12, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5,
              }}
            >
              Kelurahan/Desa
            </InputLabel>
            <Select
              value={filterKelurahan[0] || ''}
              onChange={(e) => handleKelurahanChange(e.target.value ? [e.target.value] : [])}
              displayEmpty
              renderValue={(selected) => (selected ? selected : 'Pilih Kelurahan...')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Pilih Kelurahan...</em>
              </MenuItem>
              {kelurahanOptions.map((kelurahan) => (
                <MenuItem key={kelurahan} value={kelurahan}>
                  {kelurahan}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>{t('settingsGroups')}</InputLabel>
            <Select
              label={t('settingsGroups')}
              value={asArray(filter.groups)}
              onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
              multiple
            >
              {Object.values(groups)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={filterMap} onChange={(e) => setFilterMap(e.target.checked)} />}
              label={t('sharedFilterMap')}
            />
          </FormGroup>
        </div>
      </Popover>
      <IconButton edge="end" onClick={() => navigate('/settings/device')} disabled={deviceReadonly}>
        <Tooltip
          open={!deviceReadonly && Object.keys(devices).length === 0}
          title={t('deviceRegisterFirst')}
          arrow
        >
          <AddIcon />
        </Tooltip>
      </IconButton>
    </Toolbar>
  );
};

export default MainToolbar;