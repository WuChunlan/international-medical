package com.intlmedical.config;

import com.intlmedical.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(HttpMethod.GET, "/api/hospitals/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/cases/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/equipments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/service-teams/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/service-features/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/doctors/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/config/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/i18n/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/media/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // User endpoints
                .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Hospital admin endpoints
                .requestMatchers("/api/hospital-admin/**").hasAnyRole("ADMIN", "HOSPITAL_ADMIN")
                // Reviewer endpoints
                .requestMatchers("/api/reviewer/**").hasAnyRole("ADMIN", "REVIEWER")
                // Customer rep endpoints
                .requestMatchers("/api/rep/**").hasAnyRole("ADMIN", "CUSTOMER_REP")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
