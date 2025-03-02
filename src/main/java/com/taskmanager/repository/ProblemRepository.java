package com.taskmanager.repository;

import com.taskmanager.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    // Add custom queries if needed

    @Query("SELECT DISTINCT t FROM Problem p JOIN p.tags t")
    List<String> findAllUniqueTags();
} 