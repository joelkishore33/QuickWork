package edu.virginia.quickwork;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuickWorkApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuickWorkApplication.class, args);
    }
}
