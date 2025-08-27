<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Collection;

class ValidateMaintenanceResults implements ValidationRule
{
    protected Collection $templateTasks;

    /**
     * Create a new rule instance.
     * We pass in the template's tasks so the rule knows what the requirements are.
     */
    public function __construct($templateTasks)
    {
        $this->templateTasks = $templateTasks->keyBy('label');
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        foreach ($value as $index => $resultData) {
            $taskLabel = $resultData['task_label'] ?? null;
            $task = $this->templateTasks->get($taskLabel);

            if (!$task) {
                continue; // Skip if the task doesn't exist in the template
            }

            $isMandatory = $task->options['is_mandatory'] ?? false;
            $photoRequired = $task->options['photo_required'] ?? false;

            // 1. Check if a result is provided for a mandatory task
            if ($isMandatory && is_null($resultData['result'])) {
                $fail("A result is required for the mandatory task: \"{$task->label}\".");
            }

            // 2. Check if a photo is provided for a mandatory, photo-required task
            // We check if the 'photos' array for this specific result is empty.
            if ($isMandatory && $photoRequired && empty($resultData['photos'])) {
                $fail("A photo is required for the mandatory task: \"{$task->label}\".");
            }
        }
    }
}
