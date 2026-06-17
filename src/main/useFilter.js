import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

export default (
  keyword,
  filter,
  filterSort,
  filterMap,
  positions,
  setFilteredDevices,
  setFilteredPositions,
  selectedRegionId = 0, 
) => {
  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  useEffect(() => {
    if (!devices || Object.keys(devices).length === 0) {
      return;
    }

    const deviceGroups = (device) => {
      const groupIds = [];
      let { groupId } = device;
      let safetyCounter = 0; 
      
      while (groupId && safetyCounter < 10 && groups) {
        groupIds.push(Number(groupId)); 
        const parentGroup = groups[groupId];
        if (parentGroup && parentGroup.groupId && parentGroup.groupId !== groupId) {
          groupId = parentGroup.groupId;
        } else {
          groupId = 0;
        }
        safetyCounter++;
      }
      return groupIds;
    };

    const targetRegionId = Number(selectedRegionId);

    const filtered = Object.values(devices)
      // 1. Filter Status bawaan Traccar
      .filter((device) => !filter.statuses.length || filter.statuses.includes(device.status))
      
      // 2. Filter Grup bawaan Traccar
      .filter(
        (device) =>
          !filter.groups.length || (groups && deviceGroups(device).some((id) => filter.groups.includes(id))),
      )
      
      // 3. FILTER WILAYAH ADMINISTRATIF GARUDA TRACK (DENGAN BYPASS PROTEKSI)
      .filter((device) => {
        if (!targetRegionId || targetRegionId === 0) {
          return true; 
        }
        return deviceGroups(device).includes(targetRegionId);
      })
      
      // 4. Filter Geofences bawaan Traccar
      .filter(
        (device) =>
          !filter.geofences.length ||
          (positions[device.id]?.geofenceIds || []).some((id) => filter.geofences.includes(id)),
      )
      
      // 5. Filter Pencarian Keyword (Nama/S/N)
      .filter((device) => {
        const lowerCaseKeyword = keyword.toLowerCase();
        return [device.name, device.uniqueId, device.phone, device.model, device.contact].some(
          (s) => s && s.toLowerCase().includes(lowerCaseKeyword),
        );
      });

    switch (filterSort) {
      case 'name':
        filtered.sort((device1, device2) => device1.name.localeCompare(device2.name));
        break;
      case 'lastUpdate':
        filtered.sort((device1, device2) => {
          const time1 = device1.lastUpdate ? dayjs(device1.lastUpdate).valueOf() : 0;
          const time2 = device2.lastUpdate ? dayjs(device2.lastUpdate).valueOf() : 0;
          return time2 - time1;
        });
        break;
      default:
        break;
    }
    
    setFilteredDevices(filtered);
    setFilteredPositions(
      filterMap
        ? filtered.map((device) => positions[device.id]).filter(Boolean)
        : Object.values(positions),
    );
  }, [
    keyword,
    filter,
    filterSort,
    filterMap,
    groups,
    devices,
    positions,
    setFilteredDevices,
    setFilteredPositions,
    selectedRegionId, 
  ]);
};