import React from 'react';

export function Tabs({ tabs, active, onChange }) {
  return (
    <div>
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            className={index === active ? 'tab-btn active' : 'tab-btn'}
            onClick={() => onChange(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">{tabs[active].content}</div>
    </div>
  );
}
