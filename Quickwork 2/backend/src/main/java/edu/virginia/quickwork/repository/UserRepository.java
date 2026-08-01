package edu.virginia.quickwork.repository;

import edu.virginia.quickwork.domain.User;
import edu.virginia.quickwork.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    List<User> findByRole(UserRole role);
    Optional<User> findByEmailIgnoreCase(String email);
}
