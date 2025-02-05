package com.taskmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Data
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority;
    
    @Column(name = "in_backlog")
    private boolean inBacklog;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TaskStatus status = TaskStatus.NOT_STARTED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "paused_at")
    private LocalDateTime pausedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "total_paused_time")
    private Long totalPausedTime = 0L;
    
    @Column(name = "notes", length = 4000)
    private String notes = "";
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<SubTask> subtasks = new ArrayList<>();
    
    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;
    
    public Task() {
        this.createdAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = TaskStatus.NOT_STARTED;
        }
        if (this.totalPausedTime == null) {
            this.totalPausedTime = 0L;
        }
    }
    
    public enum Priority {
        LOW, MEDIUM, HIGH
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(LocalDateTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }
} 