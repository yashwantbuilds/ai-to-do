package com.taskmanager.repository;

import com.taskmanager.model.SubTask;
import com.taskmanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubTaskRepository extends JpaRepository<SubTask, Long> {
    @Query("SELECT s FROM SubTask s WHERE s.task = ?1 ORDER BY s.createdAt ASC")
    List<SubTask> findByTaskOrderByCreatedAtAsc(Task task);
} 