package com.taskmanager.controller;

import com.taskmanager.model.Task;
import com.taskmanager.model.TaskStatus;
import com.taskmanager.model.SubTask;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.SubTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.taskmanager.dto.SubtaskUpdateRequest;
import com.taskmanager.service.TaskService;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    
    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SubTaskRepository subTaskRepository;

    @Autowired
    private TaskService taskService;

    @GetMapping
    public List<Map<String, Object>> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream().map(task -> {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("id", task.getId());
            taskMap.put("title", task.getTitle());
            taskMap.put("description", task.getDescription());
            taskMap.put("priority", task.getPriority());
            taskMap.put("status", task.getStatus());
            taskMap.put("inBacklog", task.isInBacklog());
            taskMap.put("createdAt", task.getCreatedAt());
            taskMap.put("startedAt", task.getStartedAt());
            taskMap.put("pausedAt", task.getPausedAt());
            taskMap.put("completedAt", task.getCompletedAt());
            taskMap.put("totalPausedTime", task.getTotalPausedTime());

            // Calculate elapsed time
            long elapsedSeconds = 0;
            if (task.getStartedAt() != null) {
                LocalDateTime endTime = task.getCompletedAt() != null ? 
                    task.getCompletedAt() : 
                    (task.getStatus() == TaskStatus.PAUSED ? 
                        task.getPausedAt() : 
                        LocalDateTime.now());
                
                elapsedSeconds = ChronoUnit.SECONDS.between(task.getStartedAt(), endTime);
                elapsedSeconds -= task.getTotalPausedTime();
            }
            taskMap.put("elapsedSeconds", elapsedSeconds);

            return taskMap;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@PathVariable Long id) {
        return taskRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setStatus(TaskStatus.NOT_STARTED);
        task.setCreatedAt(LocalDateTime.now());
        task.setTotalPausedTime(0L);
        return taskRepository.save(task);
    }

    @PutMapping("/{id}/backlog")
    public ResponseEntity<Task> toggleBacklog(@PathVariable Long id) {
        return taskRepository.findById(id)
            .map(task -> {
                task.setInBacklog(!task.isInBacklog());
                return ResponseEntity.ok(taskRepository.save(task));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<Task> startTask(@PathVariable Long id) {
        return (ResponseEntity<Task>) taskRepository.findById(id)
            .map(task -> {
                if (task.getStatus() == TaskStatus.NOT_STARTED || 
                    task.getStatus() == TaskStatus.PAUSED) {
                    task.setStatus(TaskStatus.IN_PROGRESS);
                    
                    // If first time starting
                    if (task.getStartedAt() == null) {
                        task.setStartedAt(LocalDateTime.now());
                    } else {
                        // If resuming from pause, calculate paused duration
                        if (task.getPausedAt() != null) {
                            long pausedDuration = ChronoUnit.SECONDS.between(
                                task.getPausedAt(), 
                                LocalDateTime.now()
                            );
                            task.setTotalPausedTime(task.getTotalPausedTime() + pausedDuration);
                        }
                    }
                    
                    task.setPausedAt(null); // Clear pause timestamp when resuming
                    return ResponseEntity.ok(taskRepository.save(task));
                }
                return ResponseEntity.badRequest().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<Task> pauseTask(@PathVariable Long id) {
        return (ResponseEntity<Task>) taskRepository.findById(id)
            .map(task -> {
                if (task.getStatus() == TaskStatus.IN_PROGRESS) {
                    task.setStatus(TaskStatus.PAUSED);
                    task.setPausedAt(LocalDateTime.now());
                    return ResponseEntity.ok(taskRepository.save(task));
                }
                return ResponseEntity.badRequest().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Task> completeTask(@PathVariable Long id) {
        return (ResponseEntity<Task>) taskRepository.findById(id)
            .map(task -> {
                if (task.getStatus() != TaskStatus.COMPLETED) {
                    LocalDateTime now = LocalDateTime.now();
                    task.setStatus(TaskStatus.COMPLETED);
                    task.setCompletedAt(now);
                    
                    // Calculate final paused duration if task was paused
                    if (task.getStatus() == TaskStatus.PAUSED && task.getPausedAt() != null) {
                        long finalPausedDuration = ChronoUnit.SECONDS.between(
                            task.getPausedAt(), 
                            now
                        );
                        task.setTotalPausedTime(task.getTotalPausedTime() + finalPausedDuration);
                    }
                    
                    return ResponseEntity.ok(taskRepository.save(task));
                }
                return ResponseEntity.badRequest().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/duration")
    public ResponseEntity<Map<String, Object>> getTaskDuration(@PathVariable Long id) {
        return taskRepository.findById(id)
            .map(task -> {
                LocalDateTime now = LocalDateTime.now();
                long totalSeconds = 0;
                long activeSeconds = 0;
                
                if (task.getStartedAt() != null) {
                    LocalDateTime endTime = task.getCompletedAt() != null ? 
                        task.getCompletedAt() : 
                        (task.getStatus() == TaskStatus.PAUSED ? task.getPausedAt() : now);
                    
                    totalSeconds = ChronoUnit.SECONDS.between(task.getStartedAt(), endTime);
                    activeSeconds = totalSeconds - task.getTotalPausedTime();
                }

                Map<String, Object> response = new HashMap<>();
                response.put("totalDuration", totalSeconds);
                response.put("activeDuration", activeSeconds);
                response.put("pausedDuration", task.getTotalPausedTime());
                response.put("status", task.getStatus());
                response.put("startedAt", task.getStartedAt());
                response.put("completedAt", task.getCompletedAt());
                response.put("pausedAt", task.getPausedAt());

                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<Task> updateNotes(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return taskRepository.findById(id)
            .map(task -> {
                task.setNotes(payload.get("notes"));
                return ResponseEntity.ok(taskRepository.save(task));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task updatedTask) {
        return taskRepository.findById(id)
            .map(task -> {
                task.setTitle(updatedTask.getTitle());
                task.setDescription(updatedTask.getDescription());
                task.setPriority(updatedTask.getPriority());
                return ResponseEntity.ok(taskRepository.save(task));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{taskId}/subtasks")
    public ResponseEntity<List<SubTask>> getSubTasks(@PathVariable Long taskId) {
        return taskRepository.findById(taskId)
            .map(task -> {
                List<SubTask> subtasks = subTaskRepository.findByTaskOrderByCreatedAtAsc(task);
                // Initialize the task to prevent lazy loading issues
                subtasks.forEach(subtask -> subtask.getTask().getId());
                return ResponseEntity.ok(subtasks);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{taskId}/subtasks")
    public ResponseEntity<SubTask> createSubTask(
        @PathVariable Long taskId,
        @RequestBody SubTask subTask
    ) {
        return taskRepository.findById(taskId)
            .map(task -> {
                subTask.setTask(task);
                subTask.setCreatedAt(LocalDateTime.now());
                return ResponseEntity.ok(subTaskRepository.save(subTask));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}/toggle")
    public ResponseEntity<SubTask> toggleSubTask(
        @PathVariable Long taskId,
        @PathVariable Long subtaskId
    ) {
        return subTaskRepository.findById(subtaskId)
            .map(subTask -> {
                subTask.setCompleted(!subTask.isCompleted());
                if (subTask.isCompleted()) {
                    subTask.setCompletedAt(LocalDateTime.now());
                } else {
                    subTask.setCompletedAt(null);
                }
                return ResponseEntity.ok(subTaskRepository.save(subTask));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubTask(
        @PathVariable Long taskId,
        @PathVariable Long subtaskId
    ) {
        return subTaskRepository.findById(subtaskId)
            .map(subTask -> {
                subTaskRepository.delete(subTask);
                return ResponseEntity.ok().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<SubTask> updateSubtask(
        @PathVariable Long taskId,
        @PathVariable Long subtaskId,
        @RequestBody SubtaskUpdateRequest request
    ) {
        SubTask updatedSubtask = taskService.updateSubtask(taskId, subtaskId, request.getTitle());
        return ResponseEntity.ok(updatedSubtask);
    }
}