import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Avatar,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 테이블 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // 다이얼로그 상태
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [newUserDialog, setNewUserDialog] = useState(false);

  // 새 사용자 정보 상태
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 조회
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError
  } = useQuery(['admin-users'], adminApi.getAllUsers, {
    enabled: isAuthenticated && user?.role?.name === 'admin'
  });

  // 역할 목록 조회
  const {
    data: roles = [],
    isLoading: rolesLoading
  } = useQuery(['admin-roles'], adminApi.getAllRoles, {
    enabled: isAuthenticated && user?.role?.name === 'admin'
  });

  // 사용자 역할 변경 뮤테이션
  const updateRoleMutation = useMutation(
    ({ userId, roleId }: { userId: number; roleId: number }) => adminApi.updateUserRole(userId, roleId),
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: '사용자 역할이 성공적으로 변경되었습니다.',
          severity: 'success'
        });
        setEditRoleDialogOpen(false);
        queryClient.invalidateQueries(['admin-users']);
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || '역할 변경 중 오류가 발생했습니다.');
      }
    }
  );

  // 사용자 생성 뮤테이션
  const createUserMutation = useMutation(
    (newUser: { name: string; email: string; password: string; roleId: string }) => adminApi.createUser(newUser),
    {
      onSuccess: () => {
        setSnackbar({
          open: true,
          message: '새 사용자가 성공적으로 생성되었습니다.',
          severity: 'success'
        });
        setNewUserDialog(false);
        queryClient.invalidateQueries(['admin-users']);
      },
      onError: (err: any) => {
        setSnackbar({
          open: true,
          message: err.response?.data?.message || '사용자 생성 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  );

  // 인증 및 권한 확인
  React.useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.role.name !== 'admin') {
        router.push('/'); // 관리자가 아닌 경우 대시보드로 리디렉션
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // 검색 필터링
  React.useEffect(() => {
    if (users && users.length > 0) {
      if (!searchQuery) {
        setFilteredUsers(users);
      } else {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = users.filter((user: any) =>
          user.name.toLowerCase().includes(lowerCaseQuery) ||
          user.email.toLowerCase().includes(lowerCaseQuery) ||
          user.role.name.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredUsers(filtered);
      }

      // 페이지 초기화 (필터링 후 첫 페이지로 이동)
      setPage(0);
    } else {
      setFilteredUsers([]);
    }
  }, [users, searchQuery]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 역할 편집 다이얼로그 열기
  const openEditRoleDialog = (user: any) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role.id);
    setEditRoleDialogOpen(true);
  };

  // 역할 변경 제출
  const handleSubmitRoleChange = () => {
    if (selectedUser && selectedRoleId) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        roleId: selectedRoleId
      });
    }
  };

  // 이메일 유효성 검사
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 사용자 생성 처리
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setSnackbar({
        open: true,
        message: '모든 필드를 입력해주세요.',
        severity: 'error'
      });
      return;
    }

    if (!isEmailValid(newUserEmail)) {
      setSnackbar({
        open: true,
        message: '유효한 이메일 주소를 입력해주세요.',
        severity: 'error'
      });
      return;
    }

    if (newUserPassword.length < 8) {
      setSnackbar({
        open: true,
        message: '비밀번호는 8자 이상이어야 합니다.',
        severity: 'error'
      });
      return;
    }

    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      roleId: newUserRole
    });
  };

  // 검색어 지우기
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 로딩 중 표시
  if (authLoading || !isAuthenticated || user?.role?.name !== 'admin' || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          사용자 관리
        </Typography>
        <Typography variant="body1" color="textSecondary">
          시스템에 등록된 사용자 목록을 관리합니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <TextField
            placeholder="이름, 이메일 또는 역할로 검색"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Chip
            label={`총 ${filteredUsers.length}명의 사용자`}
            color="primary"
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => setNewUserDialog(true)}
          >
            새 사용자 추가
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.name.toUpperCase()}
                        color={user.role.name === 'admin' ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => openEditRoleDialog(user)}
                        disabled={user.id === user?.id} // 자신의 역할은 변경할 수 없음
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    사용자가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Paper>

      {/* 역할 편집 다이얼로그 */}
      <Dialog open={editRoleDialogOpen} onClose={() => setEditRoleDialogOpen(false)}>
        <DialogTitle>사용자 역할 변경</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>{selectedUser.name}</strong> ({selectedUser.email})의 역할을 변경합니다.
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>역할</InputLabel>
                <Select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                  label="역할"
                >
                  {roles.map((role: any) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleSubmitRoleChange}
            variant="contained"
            disabled={updateRoleMutation.isLoading || selectedRoleId === selectedUser?.role.id}
          >
            {updateRoleMutation.isLoading ? '처리 중...' : '변경'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 새 사용자 생성 다이얼로그 */}
      <Dialog open={newUserDialog} onClose={() => setNewUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 사용자 생성</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            새로운 사용자 계정을 생성합니다. 생성된 계정으로 즉시 로그인할 수 있습니다.
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="이름"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="dense"
            label="이메일"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            required
            error={newUserEmail.length > 0 && !isEmailValid(newUserEmail)}
            helperText={newUserEmail.length > 0 && !isEmailValid(newUserEmail) ? '유효한 이메일 주소를 입력해주세요' : ''}
          />
          <TextField
            fullWidth
            margin="dense"
            label="비밀번호"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
            helperText="8자 이상의 비밀번호를 입력하세요"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>역할</InputLabel>
            <Select
              value={newUserRole}
              label="역할"
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              {roles.map((role: any) => (
                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUserDialog(false)}>취소</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateUser}
            disabled={createUserMutation.isLoading}
          >
            {createUserMutation.isLoading ? <CircularProgress size={24} /> : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 알림 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
