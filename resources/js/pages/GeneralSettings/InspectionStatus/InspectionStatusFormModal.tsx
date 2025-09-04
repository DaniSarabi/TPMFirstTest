import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from '@/types/maintenance';
import { Behavior, InspectionStatus } from '@/types/settings';
import { CircleX, Info, PlusCircle, Send, Trash2 } from 'lucide-react';
import * as React from 'react';
import { BehaviorsInfoModal } from '../BehaviorsInfoModal';

// A "rule" now has a temporary client-side ID for easy state management
interface BehaviorRule {
  id: number; // The actual behavior ID
  tag_id: number | null;
  ruleId: string; // A temporary ID for the UI (e.g., a UUID)
}

interface InspectionStatusFormModalProps {
  status: Partial<InspectionStatus> | null;
  tags: Tag[];
  behaviors: Behavior[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  data: any;
  setData: (key: string, value: any) => void;
  processing: boolean;
  errors: any;
}

export function InspectionStatusFormModal({
  status,
  tags,
  behaviors,
  isOpen,
  onOpenChange,
  onSubmit,
  data,
  setData,
  processing,
  errors,
}: InspectionStatusFormModalProps) {
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false);
  const isEditing = !!status?.id;

  const appliesMachineTagBehavior = behaviors.find((b) => b.name === 'applies_machine_tag');

  // These are the simple on/off behaviors
  const simpleBehaviors = behaviors.filter((b) => b.name !== 'applies_machine_tag');

  // These are just the "applies_machine_tag" rules
  const tagRules = (data.behaviors || []).filter((b: BehaviorRule) => b.id === appliesMachineTagBehavior?.id);

  // --- REFACTORED HANDLERS ---

  const handleSimpleBehaviorChange = (behaviorId: number, checked: boolean) => {
    let currentBehaviors = data.behaviors || [];
    if (checked) {
      // Add the simple behavior rule
      currentBehaviors = [...currentBehaviors, { id: behaviorId, tag_id: null, ruleId: crypto.randomUUID() }];
    } else {
      // Remove the simple behavior rule
      currentBehaviors = currentBehaviors.filter((b: BehaviorRule) => b.id !== behaviorId);
    }
    setData('behaviors', currentBehaviors);
  };

  const handleAddTagRule = () => {
    if (!appliesMachineTagBehavior) return;
    const newRule: BehaviorRule = {
      id: appliesMachineTagBehavior.id,
      tag_id: null,
      ruleId: crypto.randomUUID(),
    };
    setData('behaviors', [...(data.behaviors || []), newRule]);
  };

  const handleRemoveTagRule = (ruleIdToRemove: string) => {
    const updatedBehaviors = data.behaviors.filter((b: BehaviorRule) => b.ruleId !== ruleIdToRemove);
    setData('behaviors', updatedBehaviors);
  };

  const handleTagRuleChange = (ruleIdToUpdate: string, newTagId: number) => {
    const updatedBehaviors = data.behaviors.map((b: BehaviorRule) => (b.ruleId === ruleIdToUpdate ? { ...b, tag_id: newTagId } : b));
    setData('behaviors', updatedBehaviors);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="bg-popover sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Inspection Status' : 'Create Inspection Status'}</DialogTitle>
            <DialogDescription>Configure the rules and appearance for this status.</DialogDescription>
          </DialogHeader>

          <form id="inspection-status-form" onSubmit={onSubmit} className="grid gap-4 py-4" autoComplete="off">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                className="bg-accent ring-1 ring-ring hover:bg-accent hover:text-accent-foreground"
                type="text"
                id="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              <InputError message={errors.name} />
            </div>

            {/* Simple Behaviors */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Behaviors</Label>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsInfoModalOpen(true)}>
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 rounded-md border p-4 shadow ring-1 ring-ring drop-shadow-lg">
                {simpleBehaviors.map((behavior) => (
                  <div key={behavior.id} className="flex items-center space-x-2">
                    <Checkbox
                      className="bg-accent ring-1 ring-ring"
                      id={`behavior-${behavior.id}`}
                      checked={data.behaviors?.some((b: BehaviorRule) => b.id === behavior.id)}
                      onCheckedChange={(checked) => handleSimpleBehaviorChange(behavior.id, !!checked)}
                    />
                    <Label
                      htmlFor={`behavior-${behavior.id}`}
                      className="cursor-pointer px-2 py-0.5 hover:rounded hover:bg-accent hover:text-accent-foreground"
                    >
                      {behavior.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* --- ACTION: NEW TAG RULES SECTION --- */}
            <div className="space-y-2">
              <Label>Tag Rules</Label>
              <div className="space-y-3 rounded-md border p-4 shadow ring-1 ring-ring drop-shadow-lg">
                {tagRules.length === 0 && <p className="text-sm text-muted-foreground">No tags will be applied by this status.</p>}
                {tagRules.map((rule: any) => (
                  <div key={rule.ruleId} className="flex items-center gap-2">
                    <Select value={rule.tag_id ? String(rule.tag_id) : ''} onValueChange={(value) => handleTagRuleChange(rule.ruleId, Number(value))}>
                      <SelectTrigger className="flex-1 hover:bg-accent hover:text-accent-foreground">
                        <SelectValue placeholder="Select a tag to apply..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={String(tag.id)} className="hover:bg-accent hover:text-accent-foreground">
                            <div className="flex items-center">
                              <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span className="capitalize">{tag.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveTagRule(rule.ruleId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={handleAddTagRule}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Tag Rule
                </Button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color & Preview</Label>
              <div className="flex items-center gap-4">
                <ColorPicker
                  value={{ bgColor: data.bg_color, textColor: data.text_color }}
                  onChange={(colors) => {
                    setData('bg_color', colors.bgColor);
                    setData('text_color', colors.textColor);
                  }}
                />
                <div className="flex flex-1 items-center justify-center rounded-md p-4">
                  <Badge
                    className="px-4 py-2 text-base"
                    style={{
                      backgroundColor: data.bg_color,
                      color: data.text_color,
                    }}
                  >
                    Live Preview
                  </Badge>
                </div>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <CircleX className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" form="inspection-status-form" disabled={processing}>
              <Send className="mr-2 h-4 w-4" />
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BehaviorsInfoModal isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} behaviors={behaviors} />
    </>
  );
}
