import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Sliders, Palette } from "lucide-react";
import { SymbolTab } from "./tabs/SymbolTab";
import { CanvasTab } from "./tabs/CanvasTab";
import AsyncTemplateSelect from "./AsyncTemplateSelect";
import SaveTemplateModal from "./SaveTemplateModal";
import ConfirmUpdateModal from "./ConfirmUpdateModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import {
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/hooks/templates/useTemplates";
import { API_BASE_URL } from "@config/api";

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("symbol");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingTemplateName, setPendingTemplateName] = useState("");
  const [existingTemplateId, setExistingTemplateId] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const {
    chartTheme,
    updateCandleColors,
    updateCanvasColors,
    updateScalesColors,
    updateButtons,
    updateMargins,
    updateData,
    applyDefaults,
  } = useChartTheme();

  // Fetch template data when selected
  const { data: templateData } = useTemplate(selectedTemplateId);

  // Mutations
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  // Apply template when loaded
  useEffect(() => {
    if (templateData?.theme_data) {
      // Apply all theme settings from template
      if (templateData.theme_data.candles) {
        updateCandleColors(templateData.theme_data.candles);
      }
      if (templateData.theme_data.canvas) {
        updateCanvasColors(templateData.theme_data.canvas);
      }
      if (templateData.theme_data.scales) {
        updateScalesColors(templateData.theme_data.scales);
      }
      if (templateData.theme_data.buttons) {
        updateButtons(templateData.theme_data.buttons);
      }
      if (templateData.theme_data.margins) {
        updateMargins(templateData.theme_data.margins);
      }
      if (templateData.theme_data.data) {
        updateData(templateData.theme_data.data);
      }

      // Reset selection after applying
      setSelectedTemplateId(null);
    }
  }, [templateData]);

  const handleSaveTemplate = async (templateName) => {
    // Search for template with this exact name
    const searchResponse = await fetch(
      `${API_BASE_URL}/templates?page=1&page_size=10&search=${encodeURIComponent(templateName)}`,
    );
    const searchData = await searchResponse.json();

    // Check if any template exactly matches the name (case-insensitive)
    const existingTemplate = searchData?.templates?.find(
      (t) => t.name.toLowerCase() === templateName.toLowerCase(),
    );

    if (existingTemplate) {
      // Template exists, ask for confirmation
      setPendingTemplateName(templateName);
      setExistingTemplateId(existingTemplate.id);
      setIsSaveModalOpen(false);
      setIsConfirmModalOpen(true);
    } else {
      // Create new template
      createTemplate.mutate(
        {
          name: templateName,
          theme_data: chartTheme,
        },
        {
          onSuccess: () => {
            setIsSaveModalOpen(false);
          },
          onError: (error) => {
            console.error("Error creating template:", error);
            // If backend returns duplicate error, show error message
            if (
              error.detail?.includes("already exists") ||
              error.message?.includes("already exists")
            ) {
              alert(
                "Template name already exists. Please choose a different name.",
              );
              setIsSaveModalOpen(true);
            }
          },
        },
      );
    }
  };

  const handleConfirmUpdate = () => {
    // Update existing template
    updateTemplate.mutate(
      {
        templateId: existingTemplateId,
        templateData: {
          name: pendingTemplateName,
          theme_data: chartTheme,
        },
      },
      {
        onSuccess: () => {
          setIsConfirmModalOpen(false);
          setPendingTemplateName("");
          setExistingTemplateId(null);
        },
      },
    );
  };

  const handleCancelUpdate = () => {
    setIsConfirmModalOpen(false);
    setPendingTemplateName("");
    setExistingTemplateId(null);
    // Reopen save modal to let user enter a different name
    setIsSaveModalOpen(true);
  };

  const handleDeleteTemplate = (template) => {
    setTemplateToDelete(template);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setTemplateToDelete(null);
        },
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTemplateToDelete(null);
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: "symbol", label: "Symbol", icon: Sliders },
    { id: "canvas", label: "Canvas", icon: Palette },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "symbol":
        return (
          <SymbolTab
            chartTheme={chartTheme}
            updateCandleColors={updateCandleColors}
            updateData={updateData}
          />
        );
      case "canvas":
        return (
          <CanvasTab
            chartTheme={chartTheme}
            updateCanvasColors={updateCanvasColors}
            updateScalesColors={updateScalesColors}
            updateButtons={updateButtons}
            updateMargins={updateMargins}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-black/50 flex justify-center items-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[800px] h-[600px] flex flex-col'>
        {/* Header */}
        <div className='p-4 border-b border-border flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-bold text-primary'>Settings</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='text-primary/70 hover:text-primary h-8 w-8'
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Sidebar */}
          <div className='w-64 border-r border-border flex-shrink-0 overflow-y-auto'>
            <div className='p-2'>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-primary/70 hover:bg-foreground/5 hover:text-primary"
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    <span className='font-medium'>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 overflow-y-auto p-6'>{renderTabContent()}</div>
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-border flex justify-between items-center gap-4 flex-shrink-0'>
          {/* Template Selector - Left Side */}
          <div className='w-64'>
            <AsyncTemplateSelect
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              onApplyDefaults={applyDefaults}
              onSaveTemplate={() => setIsSaveModalOpen(true)}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </div>

          {/* Action Buttons - Right Side */}
          <div className='flex gap-2'>
            <Button variant='ghost' onClick={onClose} className='text-primary'>
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Ok
            </Button>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
      />

      {/* Confirm Update Modal */}
      <ConfirmUpdateModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelUpdate}
        onConfirm={handleConfirmUpdate}
        templateName={pendingTemplateName}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        templateName={templateToDelete?.name}
      />
    </div>
  );
};

export default SettingsModal;
