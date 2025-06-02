import sidebarMenu from "./sidebarMenu";
import { allowedLabelsByRole } from "./allowedLabels";

export function getVisibleMenuByRole(role) {
  if (role === 1) return sidebarMenu; 

  const allowedLabels = allowedLabelsByRole[role] || [];

  function filterSubmenu(submenu) {
    return submenu
      .map(item => {
        if (item.submenu) {
          const nestedFiltered = filterSubmenu(item.submenu);
          return nestedFiltered.length > 0 ? { ...item, submenu: nestedFiltered } : null;
        }
        return allowedLabels.includes(item.label) ? item : null;
      })
      .filter(Boolean);
  }

  return sidebarMenu
    .map(section => {
      const filteredSubmenu = filterSubmenu(section.submenu || []);
      return filteredSubmenu.length > 0 ? { ...section, submenu: filteredSubmenu } : null;
    })
    .filter(Boolean);
}
