package com.intlmedical.util;

import org.junit.jupiter.api.Test;
import java.util.HashSet;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class InviteCodeGeneratorTest {

    private static final String ALLOWED = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    @Test
    void generate_hasLength8AndAllowedCharsOnly() {
        for (int i = 0; i < 200; i++) {
            String code = InviteCodeGenerator.generate();
            assertEquals(8, code.length(), "长度应为8");
            for (char c : code.toCharArray()) {
                assertTrue(ALLOWED.indexOf(c) >= 0, "非法字符: " + c);
            }
        }
    }

    @Test
    void generateUnique_retriesUntilNotExists() {
        Set<String> taken = new HashSet<>();
        // 前两次都判定"已存在"，第三次才通过
        int[] calls = {0};
        String code = InviteCodeGenerator.generateUnique(c -> {
            calls[0]++;
            return calls[0] < 3; // 前2次返回 true(已存在)
        });
        assertNotNull(code);
        assertEquals(3, calls[0], "应重试到第3次");
        assertFalse(taken.contains(code));
    }
}
