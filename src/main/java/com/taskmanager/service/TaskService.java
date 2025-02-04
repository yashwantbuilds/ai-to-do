package com.taskmanager.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.taskmanager.model.SubTask;
import com.taskmanager.repository.SubTaskRepository;

@Service
public class TaskService {
    
    @Autowired
    private SubTaskRepository subTaskRepository;

    public SubTask updateSubtask(Long taskId, Long subtaskId, String title) {
        SubTask subtask = subTaskRepository.findById(subtaskId)
            .orElseThrow(() -> new RuntimeException("Subtask not found"));
        
        subtask.setTitle(title);
        return subTaskRepository.save(subtask);
    }
} 