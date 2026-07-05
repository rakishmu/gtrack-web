import { lazy, Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Paper } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import { useAttributePreference } from '../common/util/preferences';
import AppHeader from '../common/components/AppHeader';
import GlobalStyles from '@mui/material/GlobalStyles';

const MainMap = lazy(() => import('./MainMap'));

const useStyles = makeStyles()((theme) => ({
  // Kontainer scroll vertikal: seksi Peta (atas) + seksi Dashboard (bawah).
  scrollContainer: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollBehavior: 'smooth',
    scrollSnapType: 'y mandatory',
    // Sembunyikan scrollbar kontainer luar (perpindahan peta<->dashboard tetap
    // jalan lewat tombol). Sisakan hanya 1 scrollbar: milik konten dashboard.
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  // Seksi Peta = 1 layar penuh. transform:translateZ(0) menjadikannya containing
  // block bagi elemen position:fixed di dalam (AppHeader & sidebar) supaya ikut
  // tergulung keluar layar saat scroll ke dashboard, tidak menimpa iframe.
  mapSection: {
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
    transform: 'translateZ(0)',
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
  },
  dashSection: {
    position: 'relative',
    height: '100%',
    backgroundColor: '#f4f7f7',
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
  },
  dashFrame: {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 0,
  },
  dashLoading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7f7',
    zIndex: 1,
  },
  dashSpinner: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '4px solid rgba(30,140,134,0.25)',
    borderTopColor: '#1E8C86',
    animation: 'gtrackSpin 1s linear infinite',
  },
  // Tombol tengah-bawah: transparan saat diam, aktif (solid teal) saat hover.
  scrollDownBtn: {
    position: 'absolute',
    left: '50%',
    bottom: 96,
    transform: 'translateX(-50%)',
    zIndex: 1400,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 999,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: '#0F3D3A',
    background: 'rgba(255,255,255,0.35)',
    border: '1.5px solid rgba(30,140,134,0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    opacity: 0.55,
    boxShadow: '0 2px 10px rgba(30,140,134,0.15)',
    transition: 'all 0.25s ease',
    '& .MuiSvgIcon-root': {
      fontSize: 20,
      animation: 'gtrackBob 1.6s ease-in-out infinite',
    },
    '&:hover, &:focus-visible': {
      opacity: 1,
      color: '#fff',
      background: 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)',
      border: '1.5px solid rgba(255,255,255,0.6)',
      transform: 'translateX(-50%) translateY(-4px)',
      boxShadow: '0 10px 24px rgba(30,140,134,0.4)',
    },
    '&:hover .MuiSvgIcon-root, &:focus-visible .MuiSvgIcon-root': {
      animation: 'none',
    },
    [theme.breakpoints.down('md')]: {
      bottom: 72,
      fontSize: 12,
      padding: '6px 14px',
    },
  },
  root: {
    height: '100%',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: 0,
      top: 0,
      height: `calc(100% - ${theme.spacing(3)})`,
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
      width: '100%',
    },
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
    minHeight: 0,
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
    display: 'flex',
    minHeight: 0,
    backgroundColor: '#ffffff',
    '& .MuiListItemText-primary': { color: '#1E3A3A' },
    '& .MuiListItemButton-root:hover': { backgroundColor: 'rgba(43,168,162,0.06)' },
    '& .MuiListItemButton-root.Mui-selected': { backgroundColor: 'rgba(43,168,162,0.12)' },
  },
}));

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const sessionUser = useSelector((state) => state.session.user);

  const regionLock = useMemo(() => {
    const attrs = sessionUser?.attributes || {};
    const level = attrs.WILAYAH_LEVEL;
    if (!level) return null;
    return {
      level,
      provinsi: attrs.PROVINSI || null,
      kabupaten: attrs.KABUPATEN_KOTA || null,
      kecamatan: attrs.KECAMATAN || null,
      kelurahan: attrs.KELURAHAN || null,
    };
  }, [sessionUser]);

  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find(
    (position) => selectedDeviceId && position.deviceId === selectedDeviceId,
  );

  const [filteredDevices, setFilteredDevices] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('deviceFilter', {
    statuses: [],
    groups: [],
    geofences: [],
    tahun: [],
    jenis: [],
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
    kelurahan: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', true);

  const [devicesOpen, setDevicesOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  // State utama penampung ID Wilayah (Default 0 = Lolos Semua)
  const [selectedRegionId, setSelectedRegionId] = useState(0);

  // Refs untuk scroll-reveal Peta <-> Dashboard.
  const mapSectionRef = useRef(null);
  const dashSectionRef = useRef(null);
  const dashFrameRef = useRef(null);
  const [dashLoaded, setDashLoaded] = useState(false);
  const scrollToSection = (ref) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useEffect(() => {
    if (!regionLock) return;
    setFilter((prev) => ({
      ...prev,
      provinsi: regionLock.provinsi ? [regionLock.provinsi] : prev.provinsi,
      kabupaten: regionLock.kabupaten ? [regionLock.kabupaten] : prev.kabupaten,
      kecamatan: regionLock.kecamatan ? [regionLock.kecamatan] : prev.kecamatan,
      kelurahan: regionLock.kelurahan ? [regionLock.kelurahan] : prev.kelurahan,
    }));
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [regionLock]);

  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions,
    Number(selectedRegionId) || 0,
  );

  // Petakan filter toolbar -> bentuk yang dipahami store dashboard (useFilters).
  const dashboardFilter = useMemo(
    () => ({
      tahun: filter.tahun || [],
      jenisAlat: filter.jenis || [],
      provinsi: (filter.provinsi && filter.provinsi[0]) || '',
      kabupaten: (filter.kabupaten && filter.kabupaten[0]) || '',
      kecamatan: (filter.kecamatan && filter.kecamatan[0]) || '',
      kelurahan: (filter.kelurahan && filter.kelurahan[0]) || '',
    }),
    [filter],
  );

  // Kirim filter ke iframe dashboard tiap berubah / setelah iframe termuat.
  useEffect(() => {
    const win = dashFrameRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: 'gtrack:filter', payload: dashboardFilter }, window.location.origin);
  }, [dashboardFilter, dashLoaded]);

  // Pesan dari iframe dashboard: handshake "ready" & permintaan kembali ke peta.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'gtrack:ready') {
        dashFrameRef.current?.contentWindow?.postMessage(
          { type: 'gtrack:filter', payload: dashboardFilter },
          window.location.origin,
        );
      } else if (e.data?.type === 'gtrack:scrollToMap') {
        scrollToSection(mapSectionRef);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [dashboardFilter]);

  return (
    <div className={classes.scrollContainer}>
      <GlobalStyles
        styles={{
          '.maplibregl-ctrl-top-right': { marginTop: '62px' },
          '@keyframes gtrackBob': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(4px)' },
          },
          '@keyframes gtrackSpin': {
            to: { transform: 'rotate(1turn)' },
          },
        }}
      />
      <section ref={mapSectionRef} className={classes.mapSection}>
        <div className={classes.root}>
          <AppHeader onRegionChange={setSelectedRegionId} />

          {desktop && (
            <Suspense fallback={null}>
              <MainMap
                filteredPositions={filteredPositions}
                selectedPosition={selectedPosition}
                onEventsClick={onEventsClick}
              />
            </Suspense>
          )}
          <div className={classes.sidebar}>
            <Paper
              square
              elevation={3}
              className={classes.header}
              sx={{
                mt: { xs: '56px', sm: '53px' },
                background: 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)',
              }}
            >
              <MainToolbar
                filteredDevices={filteredDevices}
                devicesOpen={devicesOpen}
                setDevicesOpen={setDevicesOpen}
                keyword={keyword}
                setKeyword={setKeyword}
                filter={filter}
                setFilter={setFilter}
                filterSort={filterSort}
                setFilterSort={setFilterSort}
                filterMap={filterMap}
                setFilterMap={setFilterMap}
                regionLock={regionLock}
              />
            </Paper>
            <div className={classes.middle}>
              {!desktop && (
                <div className={classes.contentMap}>
                  <Suspense fallback={null}>
                    <MainMap
                      filteredPositions={filteredPositions}
                      selectedPosition={selectedPosition}
                      onEventsClick={onEventsClick}
                    />
                  </Suspense>
                </div>
              )}
              <Paper
                square
                className={classes.contentList}
                style={devicesOpen ? {} : { visibility: 'hidden' }}
              >
                <DeviceList devices={filteredDevices} />
              </Paper>
            </div>
          </div>
          <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
          {selectedDeviceId && (
            <StatusCard
              deviceId={selectedDeviceId}
              position={selectedPosition}
              onClose={() => dispatch(devicesActions.selectId(null))}
              desktopPadding={theme.dimensions.drawerWidthDesktop}
            />
          )}
        </div>
        <button
          type="button"
          className={classes.scrollDownBtn}
          onClick={() => scrollToSection(dashSectionRef)}
          aria-label="Buka Dashboard"
        >
          Dashboard
          <KeyboardArrowDownIcon />
        </button>
      </section>

      <section ref={dashSectionRef} className={classes.dashSection}>
        {!dashLoaded && (
          <div className={classes.dashLoading}>
            <div className={classes.dashSpinner} />
          </div>
        )}
        <iframe
          ref={dashFrameRef}
          title="Dashboard Alsintan"
          src="/dashboard/index.html"
          className={classes.dashFrame}
          loading="lazy"
          onLoad={() => setDashLoaded(true)}
        />
      </section>
    </div>
  );
};

export default MainPage;
