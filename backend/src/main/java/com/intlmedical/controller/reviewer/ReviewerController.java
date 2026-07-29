package com.intlmedical.controller.reviewer;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper specialProductMapper;
    private final PendingChangeMapper pendingChangeMapper;
    private final PendingChangeService pendingChangeService;
    private final ObjectMapper objectMapper;

    /** Wraps a pending item with metadata for the reviewer UI. */
    record PendingItem(Object data, boolean isEdit, Object currentData) {}

    // ── all-hospitals list ────────────────────────────────────────────────────

    @GetMapping("/hospitals")
    public Result<List<Hospital>> allHospitals() {
        return Result.ok(hospitalMapper.selectList(null));
    }

    // ── pending lists (new records + pending edits) ───────────────────────────

    @GetMapping("/pending/hospitals")
    public Result<List<PendingItem>> pendingHospitals() {
        List<Hospital> newRecords = hospitalMapper.selectList(
            new LambdaQueryWrapper<Hospital>().eq(Hospital::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("hospitals");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(h -> items.add(new PendingItem(h, false, null)));
        edits.forEach(pc -> {
            Hospital current = hospitalMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Hospital.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/doctors")
    public Result<List<PendingItem>> pendingDoctors() {
        List<Doctor> newRecords = doctorMapper.selectList(
            new LambdaQueryWrapper<Doctor>().eq(Doctor::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("doctors");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(d -> items.add(new PendingItem(d, false, null)));
        edits.forEach(pc -> {
            Doctor current = doctorMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Doctor.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/equipments")
    public Result<List<PendingItem>> pendingEquipments() {
        List<Equipment> newRecords = equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>().eq(Equipment::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("equipments");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(e -> items.add(new PendingItem(e, false, null)));
        edits.forEach(pc -> {
            Equipment current = equipmentMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Equipment.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/environments")
    public Result<List<PendingItem>> pendingEnvironments() {
        List<HospitalEnvironment> newRecords = hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>().eq(HospitalEnvironment::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("environments");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(env -> items.add(new PendingItem(env, false, null)));
        edits.forEach(pc -> {
            HospitalEnvironment current = hospitalEnvironmentMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), HospitalEnvironment.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/cases")
    public Result<List<PendingItem>> pendingCases() {
        List<Case> newRecords = caseMapper.selectList(
            new LambdaQueryWrapper<Case>().eq(Case::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("cases");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(c -> items.add(new PendingItem(c, false, null)));
        edits.forEach(pc -> {
            Case current = caseMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Case.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/products")
    public Result<List<PendingItem>> pendingProducts() {
        List<SpecialProduct> newRecords = specialProductMapper.selectList(
            new LambdaQueryWrapper<SpecialProduct>().eq(SpecialProduct::getAuditStatus, "pending"));
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("products");
        List<PendingItem> items = new ArrayList<>();
        newRecords.forEach(p -> items.add(new PendingItem(p, false, null)));
        edits.forEach(pc -> {
            SpecialProduct current = specialProductMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), SpecialProduct.class);
                    items.add(new PendingItem(pendingData, true, current));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    // ── approve ──────────────────────────────────────────────────────────────

    @PutMapping("/approve/{type}/{id}")
    public Result<?> approve(@PathVariable String type, @PathVariable Long id) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
        if (pc != null && "pending".equals(pc.getAuditStatus())) {
            try {
                pendingChangeService.applyApproval(type, id, pc, reviewerId);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                return Result.fail("审核失败，请重试");
            }
        } else {
            // Original approval logic for new (non-edit) records
            return updateAuditStatus(type, id, "approved", null);
        }
        return Result.ok();
    }

    // ── reject ──────────────────────────────────────────────────────────────

    @PutMapping("/reject/{type}/{id}")
    public Result<?> reject(@PathVariable String type, @PathVariable Long id,
                            @RequestBody(required = false) Map<String, String> body) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        String reason = body != null ? body.get("reason") : null;
        PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
        if (pc != null && "pending".equals(pc.getAuditStatus())) {
            pendingChangeService.applyRejection(pc, reason, reviewerId);
        } else {
            // Original rejection logic for new records
            if (reason == null || reason.isBlank()) {
                return Result.fail(400, "驳回原因不能为空");
            }
            return updateAuditStatus(type, id, "rejected", reason);
        }
        return Result.ok();
    }

    // ── edit (reviewer direct edit, keeps current audit_status) ─────────────

    @PutMapping("/edit/hospitals/{id}")
    public Result<Void> editHospital(@PathVariable Long id, @RequestBody Hospital h) {
        h.setId(id);
        hospitalMapper.updateById(h);
        return Result.ok();
    }

    @PutMapping("/edit/doctors/{id}")
    public Result<Void> editDoctor(@PathVariable Long id, @RequestBody Doctor d) {
        d.setId(id);
        doctorMapper.updateById(d);
        return Result.ok();
    }

    @PutMapping("/edit/equipments/{id}")
    public Result<Void> editEquipment(@PathVariable Long id, @RequestBody Equipment e) {
        e.setId(id);
        equipmentMapper.updateById(e);
        return Result.ok();
    }

    @PutMapping("/edit/environments/{id}")
    public Result<Void> editEnvironment(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        hospitalEnvironmentMapper.updateById(env);
        return Result.ok();
    }

    @PutMapping("/edit/cases/{id}")
    public Result<Void> editCase(@PathVariable Long id, @RequestBody Case c) {
        c.setId(id);
        caseMapper.updateById(c);
        return Result.ok();
    }

    @PutMapping("/edit/products/{id}")
    public Result<Void> editProduct(@PathVariable Long id, @RequestBody SpecialProduct p) {
        p.setId(id);
        specialProductMapper.updateById(p);
        return Result.ok();
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private Result<Void> updateAuditStatus(String type, Long id, String status, String reason) {
        switch (type) {
            case "hospitals" -> hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
                .eq(Hospital::getId, id).set(Hospital::getAuditStatus, status).set(Hospital::getRejectionReason, reason));
            case "doctors" -> doctorMapper.update(null, new LambdaUpdateWrapper<Doctor>()
                .eq(Doctor::getId, id).set(Doctor::getAuditStatus, status).set(Doctor::getRejectionReason, reason));
            case "equipments" -> equipmentMapper.update(null, new LambdaUpdateWrapper<Equipment>()
                .eq(Equipment::getId, id).set(Equipment::getAuditStatus, status).set(Equipment::getRejectionReason, reason));
            case "environments" -> hospitalEnvironmentMapper.update(null, new LambdaUpdateWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getId, id).set(HospitalEnvironment::getAuditStatus, status).set(HospitalEnvironment::getRejectionReason, reason));
            case "cases" -> caseMapper.update(null, new LambdaUpdateWrapper<Case>()
                .eq(Case::getId, id).set(Case::getAuditStatus, status).set(Case::getRejectionReason, reason));
            case "products" -> specialProductMapper.update(null, new LambdaUpdateWrapper<SpecialProduct>()
                .eq(SpecialProduct::getId, id).set(SpecialProduct::getAuditStatus, status).set(SpecialProduct::getRejectionReason, reason));
            default -> { return Result.fail(400, "未知资源类型: " + type); }
        }
        return Result.ok();
    }

    @Data
    public static class RejectRequest {
        private String reason;
    }
}
