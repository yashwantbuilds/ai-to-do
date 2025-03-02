package com.taskmanager.controller;

import com.taskmanager.model.Problem;
import com.taskmanager.repository.ProblemRepository;
import com.taskmanager.service.HuggingFaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private HuggingFaceService huggingFaceService;

    @GetMapping
    public List<Problem> getAllProblems() {
        return problemRepository.findAll();
    }

    @PostMapping
    public Problem createProblem(@RequestBody Problem problem) {
        return problemRepository.save(problem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Problem> updateProblem(@PathVariable Long id, @RequestBody Problem updatedProblem) {
        return problemRepository.findById(id)
            .map(problem -> {
                problem.setName(updatedProblem.getName());
                problem.setLink(updatedProblem.getLink());
                problem.setDescription(updatedProblem.getDescription());
                problem.setNotes(updatedProblem.getNotes());
                problem.setTags(updatedProblem.getTags());
                problem.setStatus(updatedProblem.getStatus());
                problem.setExampleLinks(updatedProblem.getExampleLinks());
                return ResponseEntity.ok(problemRepository.save(problem));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        return problemRepository.findById(id)
            .map(problem -> {
                problemRepository.delete(problem);
                return ResponseEntity.ok().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tags")
    public List<String> getAllTags() {
        return problemRepository.findAllUniqueTags();
    }

    @PostMapping("/generate-signature")
    public ResponseEntity<String> generateMethodSignature(@RequestBody Map<String, String> body) {
        String description = body.get("description");
        if (description == null || description.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Description is required");
        }
        String signature = huggingFaceService.generateMethodSignature(description);
        return ResponseEntity.ok(signature);
    }

    @PostMapping("/generate-implementation")
    public ResponseEntity<String> generateImplementation(@RequestBody Map<String, String> body) {
        String methodSignature = body.get("methodSignature");
        String algorithm = body.get("algorithm");
        
        if (methodSignature == null || algorithm == null || 
            methodSignature.trim().isEmpty() || algorithm.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Method signature and algorithm are required");
        }
        
        String implementation = huggingFaceService.generateImplementation(methodSignature, algorithm);
        return ResponseEntity.ok(implementation);
    }
} 