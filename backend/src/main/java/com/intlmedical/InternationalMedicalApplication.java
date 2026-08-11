package com.intlmedical;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@MapperScan("com.intlmedical.mapper")
public class InternationalMedicalApplication {
    public static void main(String[] args) {
        SpringApplication.run(InternationalMedicalApplication.class, args);
    }
}
