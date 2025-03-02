package com.taskmanager.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Data
@Table(name = "problems")
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String name;

    @Column
    private String link;

    @Column(length = 4000)
    private String notes;

    @Column(length = 4000)
    private String description;

    @ElementCollection
    @CollectionTable(name = "problem_tags", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "problem_examples", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "example_link")
    private List<String> exampleLinks = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProblemStatus status = ProblemStatus.UNSOLVED;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
} 