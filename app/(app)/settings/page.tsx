'use client';

import { useState } from 'react';
import { Eye, EyeOff, Moon, Sun, Sparkles, Github, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useSettingsStore } from '@/stores/settingsStore';
import { FRAMEWORKS, MODELS, type FrameworkId, type ThemeMode } from '@/types';
import { exportAndDownload } from '@/lib/utils/export';

export default function SettingsPage() {
  const {
    theme,
    autoNightMode,
    nightModeStart,
    nightModeEnd,
    defaultFramework,
    defaultModel,
    openaiApiKey,
    setTheme,
    setAutoNightMode,
    setNightModeTime,
    setDefaultFramework,
    setDefaultModel,
    setOpenAIApiKey,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey || '');
  const [isExporting, setIsExporting] = useState(false);

  const handleSaveApiKey = () => {
    setOpenAIApiKey(apiKeyInput);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportAndDownload();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'aggressive-dark', label: 'Aggressive Dark (Night Mode)' },
  ];

  const frameworkOptions = (Object.keys(FRAMEWORKS) as FrameworkId[]).map(
    (id) => ({
      value: id,
      label: FRAMEWORKS[id].name,
    })
  );

  const modelOptions = MODELS.filter((m) => m.provider === 'openai').map((m) => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your DreamLens experience
        </p>
      </header>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OpenAI API Key</CardTitle>
          <CardDescription>
            Required for dream interpretation. Your key is stored locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button onClick={handleSaveApiKey}>Save</Button>
          </div>
          {openaiApiKey && (
            <p className="text-xs text-muted-foreground">
              API key saved and ready to use
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenAI Platform
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {theme === 'light' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              options={themeOptions}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Night Mode</p>
              <p className="text-xs text-muted-foreground">
                Automatically switch to aggressive dark mode at night
              </p>
            </div>
            <Button
              variant={autoNightMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoNightMode(!autoNightMode)}
            >
              {autoNightMode ? 'On' : 'Off'}
            </Button>
          </div>

          {autoNightMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={nightModeStart}
                  onChange={(e) =>
                    setNightModeTime(e.target.value, nightModeEnd)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={nightModeEnd}
                  onChange={(e) =>
                    setNightModeTime(nightModeStart, e.target.value)
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Interpretation Defaults
          </CardTitle>
          <CardDescription>
            Set your preferred framework and model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Framework</label>
            <Select
              value={defaultFramework}
              onChange={(e) => setDefaultFramework(e.target.value as FrameworkId)}
              options={frameworkOptions}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Default Model</label>
            <Select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              options={modelOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Download all your dreams, interpretations, and conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your complete DreamLens data as a JSON file. This includes all
            dreams, interpretations, conversations, and symbols stored locally on
            this device.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </Button>
          <p className="text-xs text-muted-foreground">
            The exported file can be used for backup or importing into another
            device (import functionality coming soon).
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About DreamLens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            DreamLens is an AI-powered dream journal that helps you understand
            your dreams through multiple psychological frameworks.
          </p>
          <p>Version: 0.1.0 (MVP)</p>
          <a
            href="https://github.com/critesjosh/dreamlens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline w-fit"
          >
            <Github className="h-4 w-4" />
            View source on GitHub
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
