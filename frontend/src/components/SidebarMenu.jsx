import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import menuIconMap from '../utils/menuIcons';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';
import './SidebarMenu.css';

function buildTree(flatMenus) {
  const map = {};
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

// ── Recursive menu node ─────────────────────────────────────────────────────
function MenuNode({ node, depth, openRootId, setOpenRootId, openSubIds, setOpenSubIds }) {
  const hasChildren = node.children && node.children.length > 0;

  const isOpen = depth === 0
    ? openRootId === node.MENU_ID
    : openSubIds.has(node.MENU_ID);

  const toggle = () => {
    if (depth === 0) {
      setOpenRootId(prev => (prev === node.MENU_ID ? null : node.MENU_ID));
    } else {
      setOpenSubIds(prev => {
        const next = new Set(prev);
        next.has(node.MENU_ID) ? next.delete(node.MENU_ID) : next.add(node.MENU_ID);
        return next;
      });
    }
  };

  // Leaf at depth 1
  if (!hasChildren && depth === 1) {
    return (
      <li>
        <a href={node.MENU_URL} className="submenu-leaf-link">
          {node.MENU_NAME}
        </a>
      </li>
    );
  }

  // Leaf at depth ≥ 2
  if (!hasChildren) {
    return (
      <li style={{ padding: '2px 0' }}>
        <a href={node.MENU_URL}
          style={{ display: 'block', padding: '5px 12px', fontSize: 12, color: '#94a3b8',
                   borderRadius: 5, textDecoration: 'none' }}>
          {node.MENU_NAME}
        </a>
      </li>
    );
  }

  // Top-level section (depth 0) — icon + accordion
  if (depth === 0) {
    const icon = menuIconMap[node.MENU_CODE];
    return (
      <div>
        <div onClick={toggle} className={`menu-top-item${isOpen ? ' open' : ''}`}>
          <span className="menu-title">
            {icon && <FontAwesomeIcon icon={icon} className="icon" />}
            {node.MENU_NAME}
          </span>
          {isOpen
            ? <ChevronDown size={15} style={{ color: '#64748b' }} />
            : <ChevronRight size={15} style={{ color: '#64748b' }} />}
        </div>
        {isOpen && (
          <ul className="submenu-link">
            {node.children.map(child => (
              <MenuNode
                key={child.MENU_ID}
                node={child}
                depth={1}
                openRootId={openRootId}
                setOpenRootId={setOpenRootId}
                openSubIds={openSubIds}
                setOpenSubIds={setOpenSubIds}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Nested expandable group (depth ≥ 1 with children)
  return (
    <li>
      <div className="submenu-group-title" onClick={toggle}>
        {node.MENU_NAME}
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </div>
      {isOpen && (
        <ul style={{ listStyle: 'none', margin: '0 0 4px 12px', padding: 0 }}>
          {node.children.map(child => (
            <MenuNode
              key={child.MENU_ID}
              node={child}
              depth={depth + 1}
              openRootId={openRootId}
              setOpenRootId={setOpenRootId}
              openSubIds={openSubIds}
              setOpenSubIds={setOpenSubIds}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Sidebar shell ────────────────────────────────────────────────────────────
function Sidebar() {
  const [menuTree, setMenuTree] = useState([]);
  const [openRootId, setOpenRootId] = useState(null);
  const [openSubIds, setOpenSubIds] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');

    const headers = {};
    const url = token
      ? `${API_BASE_URL}/api/users/me/menus`
      : `${API_BASE_URL}/api/menus`;

    authFetch(url, { headers })
      .then(res => {
        if (!res.ok) throw new Error('menus fetch failed');
        return res.json();
      })
      .then(flat => setMenuTree(buildTree(flat)))
      .catch(() => {
        if (token) {
          // Authenticated request failed — don't leak all menus; show empty
          setMenuTree([]);
        } else {
          // No token — fall back to public menu list
          authFetch(`${API_BASE_URL}/api/menus`)
            .then(r => r.json())
            .then(flat => setMenuTree(buildTree(flat)))
            .catch(() => setMenuTree([]));
        }
      });
  }, []);

  return (
    <div className="sidebar-menu">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🏥</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">City General Hospital</div>
          <div className="sidebar-brand-sub">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, paddingBottom: 16 }}>
        {menuTree.map(menu => (
          <MenuNode
            key={menu.MENU_ID}
            node={menu}
            depth={0}
            openRootId={openRootId}
            setOpenRootId={setOpenRootId}
            openSubIds={openSubIds}
            setOpenSubIds={setOpenSubIds}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e3a5f',
        fontSize: 10,
        color: '#334155',
        textAlign: 'center',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}>
        HMS v1.0 · City General Hospital
      </div>
    </div>
  );
}

export default Sidebar;
