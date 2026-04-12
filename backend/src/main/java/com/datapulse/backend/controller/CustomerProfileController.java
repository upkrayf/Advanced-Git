package com.datapulse.backend.controller;

import com.datapulse.backend.entity.CustomerProfile;
import com.datapulse.backend.entity.User;
import com.datapulse.backend.repository.CustomerProfileRepository;
import com.datapulse.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerProfileController {

    private final CustomerProfileRepository profileRepository;
    private final UserRepository userRepository;

    public CustomerProfileController(CustomerProfileRepository profileRepository,
                                     UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<CustomerProfile> getMyProfile(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        return profileRepository.findByUserId(currentUser.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<CustomerProfile> updateMyProfile(@AuthenticationPrincipal User currentUser,
                                                           @RequestBody CustomerProfile profileRequest) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        CustomerProfile profile = profileRepository.findByUserId(currentUser.getId())
                .orElse(new CustomerProfile());
        profile.setUser(currentUser);
        profile.setAge(profileRequest.getAge());
        profile.setCity(profileRequest.getCity());
        profile.setMembershipType(profileRequest.getMembershipType());
        profileRepository.save(profile);
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CustomerProfile> getProfileByUserId(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .flatMap(user -> profileRepository.findByUserId(user.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}