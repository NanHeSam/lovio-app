'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { ActivityType, ActivityDetails, FeedDetails, DiaperDetails } from '@/lib/db/types';

interface Activity {
  id: string;
  type: ActivityType;
  startTime: string;
  endTime: string | null;
  details: ActivityDetails | null;
  createdAt: string;
}

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  childId: string;
  onSave: (updatedActivity: Activity) => void;
}

export default function EditActivityModal({
  isOpen,
  onClose,
  activity,
  childId,
  onSave
}: EditActivityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'sleep' as ActivityType,
    startTime: '',
    endTime: '',
    details: {} as ActivityDetails,
  });

  useEffect(() => {
    if (activity) {
      const startTime = new Date(activity.startTime);
      const endTime = activity.endTime ? new Date(activity.endTime) : null;
      
      setFormData({
        type: activity.type,
        startTime: startTime.toISOString().slice(0, 16), // Format for datetime-local input
        endTime: endTime ? endTime.toISOString().slice(0, 16) : '',
        details: activity.details || {},
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/activities/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.id,
          startTime: formData.startTime,
          endTime: formData.endTime || null,
          details: formData.details,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update activity');
      }

      const { activity: updatedActivity } = await response.json();
      onSave(updatedActivity);
      onClose();
    } catch (error) {
      console.error('Error updating activity:', error);
      alert(error instanceof Error ? error.message : 'Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value,
      } as ActivityDetails,
    }));
  };

  const renderDetailsFields = () => {
    switch (formData.type) {
      case 'feed':
        const feedDetails = formData.details as FeedDetails;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedType">Feed Type</Label>
              <Select
                id="feedType"
                value={feedDetails?.type || 'bottle'}
                onChange={(e) => handleDetailChange('type', e.target.value)}
              >
                <option value="bottle">Bottle</option>
                <option value="nursing">Nursing</option>
              </Select>
            </div>
            
            {feedDetails?.type === 'bottle' && (
              <>
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={feedDetails.volume || ''}
                    onChange={(e) => handleDetailChange('volume', parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    id="unit"
                    value={feedDetails.unit || 'ml'}
                    onChange={(e) => handleDetailChange('unit', e.target.value)}
                  >
                    <option value="ml">ml</option>
                    <option value="oz">oz</option>
                  </Select>
                </div>
              </>
            )}
            
            {feedDetails?.type === 'nursing' && (
              <>
                <div>
                  <Label htmlFor="leftDuration">Left Duration (minutes)</Label>
                  <Input
                    id="leftDuration"
                    type="number"
                    value={feedDetails.leftDuration || ''}
                    onChange={(e) => handleDetailChange('leftDuration', parseInt(e.target.value) || 0)}
                    placeholder="Minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="rightDuration">Right Duration (minutes)</Label>
                  <Input
                    id="rightDuration"
                    type="number"
                    value={feedDetails.rightDuration || ''}
                    onChange={(e) => handleDetailChange('rightDuration', parseInt(e.target.value) || 0)}
                    placeholder="Minutes"
                  />
                </div>
              </>
            )}
          </div>
        );
        
      case 'diaper':
        const diaperDetails = formData.details as DiaperDetails;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contents">Contents</Label>
              <Select
                id="contents"
                value={diaperDetails?.contents || 'pee'}
                onChange={(e) => handleDetailChange('contents', e.target.value)}
              >
                <option value="pee">Pee</option>
                <option value="poo">Poo</option>
                <option value="both">Both</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="volume">Volume</Label>
              <Select
                id="volume"
                value={diaperDetails?.volume || 'normal'}
                onChange={(e) => handleDetailChange('volume', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="normal">Normal</option>
                <option value="heavy">Heavy</option>
              </Select>
            </div>
            
            {diaperDetails?.contents !== 'pee' && (
              <>
                <div>
                  <Label htmlFor="pooColor">Poo Color</Label>
                  <Select
                    id="pooColor"
                    value={diaperDetails?.pooColor || 'yellow'}
                    onChange={(e) => handleDetailChange('pooColor', e.target.value)}
                  >
                    <option value="yellow">Yellow</option>
                    <option value="brown">Brown</option>
                    <option value="green">Green</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pooTexture">Poo Texture</Label>
                  <Select
                    id="pooTexture"
                    value={diaperDetails?.pooTexture || 'normal'}
                    onChange={(e) => handleDetailChange('pooTexture', e.target.value)}
                  >
                    <option value="watery">Watery</option>
                    <option value="soft">Soft</option>
                    <option value="normal">Normal</option>
                    <option value="firm">Firm</option>
                  </Select>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasRash"
                checked={diaperDetails?.hasRash || false}
                onChange={(e) => handleDetailChange('hasRash', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hasRash">Has Rash</Label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'sleep': return '😴';
      case 'feed': return '🍼';
      case 'diaper': return '👶';
      default: return '📝';
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getActivityIcon(formData.type)}</span>
            <div>
              <h3 className="text-lg font-semibold">Edit Activity</h3>
              <p className="text-sm text-gray-600">Modify activity details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Activity Type */}
            <div>
              <Label htmlFor="activityType">Activity Type</Label>
              <Select
                id="activityType"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                disabled
              >
                <option value="sleep">Sleep</option>
                <option value="feed">Feed</option>
                <option value="diaper">Diaper</option>
              </Select>
            </div>

            {/* Start Time */}
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            {/* End Time */}
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>

            {/* Activity-specific details */}
            {renderDetailsFields()}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}