import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
  isComplete?: boolean;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, activeTab: controlledActiveTab, onChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onChange?.(tabId);
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="w-full">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.isComplete && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6 animate-fadeIn">{currentTab?.content}</div>
    </div>
  );
};
