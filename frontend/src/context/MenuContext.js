import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

const MenuContext = createContext({ menuTree: [], loading: true, refreshMenus: () => {} });

function buildTree(flatMenus) {
  const map   = {};
  const roots = [];

  flatMenus.forEach(m => { map[m.MENU_ID] = { ...m, children: [] }; });
  flatMenus.forEach(m => {
    if (m.PARENT_MENU_ID && map[m.PARENT_MENU_ID]) {
      map[m.PARENT_MENU_ID].children.push(map[m.MENU_ID]);
    } else if (!m.PARENT_MENU_ID) {
      roots.push(map[m.MENU_ID]);
    }
  });

  return roots;
}

export function MenuProvider({ children }) {
  const [menuTree,    setMenuTree]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshKey,  setRefreshKey]  = useState(0);

  // Call this after login so the sidebar reloads for the newly authenticated user
  const refreshMenus = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // No session — sidebar stays empty (user is on login page)
      setMenuTree([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    authFetch(`${API_BASE_URL}/api/users/me/menus`)
      .then(res => {
        if (!res.ok) throw new Error('Unauthorised');
        return res.json();
      })
      .then(flat => {
        setMenuTree(buildTree(flat));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load RBAC menus:', err);
        setMenuTree([]);
        setLoading(false);
      });
  }, [refreshKey]);   // re-runs whenever refreshMenus() is called

  return (
    <MenuContext.Provider value={{ menuTree, loading, refreshMenus }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
