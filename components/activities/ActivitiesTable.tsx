'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Filter,
  Calendar,
  Clock,
  Baby,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import EditActivityModal from './EditActivityModal';
import type { ActivityType, ActivityDetails, FeedDetails, DiaperDetails } from '@/lib/db/types';

interface Activity {
  id: string;
  type: ActivityType;
  startTime: string;
  endTime: string | null;
  details: ActivityDetails | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ActivitiesTableProps {
  childId: string;
}

export default function ActivitiesTable({ childId }: ActivitiesTableProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filters and sorting
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Selection and editing
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    activityId?: string;
    isBulk?: boolean;
  }>({ show: false });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/activities/${childId}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Clear selection when activities are refreshed
    setSelectedActivities(new Set());
  }, [childId, pagination.page, filterType, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActivities(new Set(activities.map(a => a.id)));
    } else {
      setSelectedActivities(new Set());
    }
  };

  const handleSelectActivity = (activityId: string, checked: boolean) => {
    const newSelection = new Set(selectedActivities);
    if (checked) {
      newSelection.add(activityId);
    } else {
      newSelection.delete(activityId);
    }
    setSelectedActivities(newSelection);
  };

  // Edit handlers
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowEditModal(true);
  };

  const handleSaveActivity = async (updatedActivity: Activity) => {
    // Update the activity in the local state
    setActivities(prev => 
      prev.map(a => a.id === updatedActivity.id ? updatedActivity : a)
    );
    setShowEditModal(false);
    setEditingActivity(null);
  };

  // Delete handlers
  const handleDeleteActivity = (activityId: string) => {
    setDeleteConfirmation({ show: true, activityId, isBulk: false });
  };

  const handleBulkDelete = () => {
    if (selectedActivities.size === 0) return;
    setDeleteConfirmation({ show: true, isBulk: true });
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      if (deleteConfirmation.isBulk) {
        // Bulk delete
        const activityIds = Array.from(selectedActivities).join(',');
        const response = await fetch(`/api/activities/${childId}?activityIds=${activityIds}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete activities');
        }
        
        
      } else if (deleteConfirmation.activityId) {
        // Single delete
        const response = await fetch(`/api/activities/${childId}?activityId=${deleteConfirmation.activityId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete activity');
        }
      }
      
      // Refresh activities and pagination data
      await fetchActivities();
      setSelectedActivities(new Set());
      setDeleteConfirmation({ show: false });
    } catch (error) {
      console.error('Error deleting activities:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete activities');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false });
  };

  const formatDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return 'Ongoing';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const formatTime = (timeString: string): string => {
    return new Date(timeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'sleep': return '😴';
      case 'feed': return '🍼';
      case 'diaper': return '👶';
      default: return '📝';
    }
  };

  const getActivityDetails = (type: ActivityType, details: ActivityDetails | null): string => {
    if (!details) return '-';
    
    switch (type) {
      case 'feed':
        const feedDetails = details as FeedDetails;
        if (feedDetails.type === 'bottle') {
          return `${feedDetails.volume || 0}${feedDetails.unit || 'ml'}`;
        } else if (feedDetails.type === 'nursing') {
          return `L: ${feedDetails.leftDuration || 0}m, R: ${feedDetails.rightDuration || 0}m`;
        }
        return 'Nursing';
        
      case 'diaper':
        const diaperDetails = details as DiaperDetails;
        return `${diaperDetails.contents || 'Unknown'}${diaperDetails.volume ? ` (${diaperDetails.volume})` : ''}`;
        
      default:
        return '-';
    }
  };

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(column)}
      className="h-auto p-1 font-medium hover:bg-gray-100"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </span>
    </Button>
  );

  if (loading && activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchActivities}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Activity Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ActivityType | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="all">All Activities</option>
                <option value="sleep">Sleep</option>
                <option value="feed">Feed</option>
                <option value="diaper">Diaper</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activities ({pagination.total} total)</span>
            <div className="flex items-center gap-3">
              {selectedActivities.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedActivities.size})
                </Button>
              )}
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 w-12">
                    <Checkbox
                      checked={activities.length > 0 && selectedActivities.size === activities.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">
                    <SortButton column="startTime">
                      <Calendar className="w-4 h-4" />
                      Start Time
                    </SortButton>
                  </th>
                  <th className="text-left py-3 px-2">End Time</th>
                  <th className="text-left py-3 px-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>
                  </th>
                  <th className="text-left py-3 px-2">Details</th>
                  <th className="text-left py-3 px-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Checkbox
                        checked={selectedActivities.has(activity.id)}
                        onChange={(e) => handleSelectActivity(activity.id, e.target.checked)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <span className="font-medium capitalize">{activity.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {formatTime(activity.startTime)}
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {activity.endTime ? formatTime(activity.endTime) : (
                        <span className="text-blue-600 font-medium">Ongoing</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-medium ${activity.endTime ? 'text-gray-900' : 'text-blue-600'}`}>
                        {formatDuration(activity.startTime, activity.endTime)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-700">
                      {getActivityDetails(activity.type, activity.details)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditActivity(activity)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activities.length === 0 && (
            <div className="text-center py-8">
              <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activities found</p>
              <p className="text-gray-500 text-sm">Try changing your filters or add some activities</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditActivityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        activity={editingActivity}
        childId={childId}
        onSave={handleSaveActivity}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {deleteConfirmation.isBulk ? 'Delete Selected Activities' : 'Delete Activity'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {deleteConfirmation.isBulk 
                      ? `Are you sure you want to delete ${selectedActivities.size} selected activities?`
                      : 'Are you sure you want to delete this activity?'
                    }
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The activity data will be permanently deleted.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}